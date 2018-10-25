import { Component, OnInit } from '@angular/core';
import { TuioClient } from 'tuio-client';

import { environment } from '../../environments/environment';
import { ConfigurationService } from '../configuration.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { MapService } from '../map/map.service';
import { AnalysisService } from '../analysis.service';
import { Plot } from '../plot.model';
import { RadarChartData } from '../radar-chart/radar-chart-data.model';
import { MarkerType } from '../marker-type.enum';

@Component({
  selector: 'app-touchscreen',
  templateUrl: './touchscreen.component.html',
  styleUrls: ['./touchscreen.component.css']
})
export class TouchscreenComponent implements OnInit {
  steps = [1, 2, 3, 4, 5];
  currentStep: number;
  currentStepHasMap: boolean;
  currentStepHasCanvas: boolean;
  private initialAngle: number;
  private initialLocked: boolean;
  private lastSelectedPlot: Plot;
  private bestPlot: Plot;
  private activeMarkers: number[] = [];
  private sitesLayer: MapLayer;

  constructor(private config: ConfigurationService, private localStorageService: LocalStorageService, private tuioClient: TuioClient,
    private mapService: MapService, private analysisService: AnalysisService) { }

  ngOnInit() {
    this.sitesLayer = this.mapService.getTopicLayerByName('sites');
    this.tuioClient.connect(environment.socketUrl);
  }

  setStep(step: number) {
    if (isNaN(step)) {
      return;
    }

    if (step !== this.currentStep) {
      this.currentStep = step;
      this.currentStepHasMap = [1, 3, 4, 5].indexOf(step) > -1;
      this.currentStepHasCanvas = step === 2;
      this.localStorageService.sendSetProgress(step);
    }

    if (step === 5 && !this.bestPlot) {
      this.bestPlot = this.analysisService.getBestPlot();
      this.mapService.zoomTo(this.bestPlot.centerpoint, 13, 17);
      this.localStorageService.sendComputerSagt(
        this.bestPlot,
        this.plotToRadarChartData(this.bestPlot)
      );
    }
  }

  onUpdateObject(evt: CustomEvent) {
    evt.stopPropagation();

    const target = <Element>evt.target;
    const object = evt.detail;

    if (event.type === 'addobject') {
      this.activeMarkers.push(object.classId);
    }

    const adjustableCriterion = this.findCriterionByMarkerId(object.classId);

    // The progress marker is used to switch between application steps
    // The parameter markers set the weights for the individual criteria (step 2)
    // The selection marker queries and locks plots on the map (step 3)
    const activeMarkerType = adjustableCriterion ? MarkerType.parameter :
      object.classId === this.config.progressMarkerID ? MarkerType.progress :
      object.classId === this.config.selectionMarkerID ? MarkerType.select : 0;

    switch (activeMarkerType) {
      case MarkerType.progress:
        if (target) {
          this.setStep(parseInt(target.id.substr(4), 10)); // 'step1' => 1
        }
        break;

      case MarkerType.parameter:
        if (this.currentStep !== 2) {
          break;
        }
        this.bestPlot = null;
        // Create an immutable object so the CanvasComponent's change detection is triggered
        this.analysisService.updateTargetCriteria(adjustableCriterion.key, Math.max(0, Math.min(1, object.aAngle / Math.PI - 0.5)));
        this.localStorageService.sendSetCriteria(this.analysisService.targetCriteria);
        break;

      case MarkerType.select:
        if (this.currentStep !== 3) {
          break;
        }
        const coordinate = this.mapService.getCoordinateFromXY(object.xPosition, object.yPosition);
        if (!coordinate) {
          return;
        }
        const changedPlot = this.mapService.getSelectedFeatures(coordinate)[0];

        if (changedPlot) {
          this.mapService.dispatchSelectEvent(this.sitesLayer, [changedPlot], coordinate);

          this.initialAngle = object.aAngle;
          // FIXME unnecessary assignment
          this.initialLocked = !!this.analysisService.findTopPlotById(changedPlot.getId());
          this.initialLocked = false;
        }
        if (!this.lastSelectedPlot) {
          return;
        }

        // Make sure the lock mechanism only works while the marker is near the geometry
        if (!this.mapService.featureBufferContainsCoordinate(this.lastSelectedPlot.id, coordinate)) {
          return;
        }

        const plotIsTopPlot = !!this.analysisService.findTopPlotById(this.lastSelectedPlot.id);

        // Lock/unlock at a 1/4 marker rotation clockwise or anticlockwise
        let relativeAngle = object.aAngle - this.initialAngle + Math.PI / 2;
        if (relativeAngle < 0) {
          relativeAngle += 2 * Math.PI;
        }
        const doChange = relativeAngle >= Math.PI;

        if (this.initialLocked && plotIsTopPlot && doChange ||
          !this.initialLocked && plotIsTopPlot && !doChange) {
          this.analysisService.topPlots.splice(this.analysisService.topPlots.indexOf(this.lastSelectedPlot), 1);
          this.analysisService.unlockPlot(this.lastSelectedPlot);
          this.mapService.applySelectedStyle(this.lastSelectedPlot.id, this.sitesLayer);
        }
        if (this.initialLocked && !plotIsTopPlot && !doChange ||
          !this.initialLocked && !plotIsTopPlot && doChange) {
          this.analysisService.topPlots.push(this.lastSelectedPlot);
          this.analysisService.lockPlot(this.lastSelectedPlot);
          this.mapService.applyExtraStyle(this.lastSelectedPlot.id, this.sitesLayer);
        }

        this.localStorageService.sendSetTopPlots(
          this.analysisService.topPlots,
          this.analysisService.topPlots.map(this.plotToRadarChartData, this)
        );
    }
  }

  onRemoveObject(evt: CustomEvent) {
    evt.stopPropagation();

    const object = evt.detail;

    if (event.type === 'removeobject') {
      this.activeMarkers = this.activeMarkers.filter(item => item !== object.classId);
    }
  }

  onSelectFeature(olFeature: ol.Feature) {
    const plot = this.analysisService.allPlots.find(item => item.id === olFeature.getId());
    this.sendSelectPlot(plot);
  }

  onToggleLockFeature(olFeature: ol.Feature) {
    const plot = this.analysisService.allPlots.find(item => item.id === olFeature.getId());
    const locked = !!this.analysisService.topPlots.find(item => item.id === olFeature.getId());

    if (locked) {
      this.analysisService.unlockPlot(plot);
      this.mapService.applySelectedStyle(olFeature.getId(), this.sitesLayer);
    } else {
      this.analysisService.lockPlot(plot);
      this.mapService.applyExtraStyle(olFeature.getId(), this.sitesLayer);
    }
    this.sendTopPlots();
  }

  findCriterionByMarkerId(markerId: number) {
    return this.config.searchCriteria.find(item => item.markerID === markerId);
  }

  plotToRadarChartData(plot: Plot) {
    return new RadarChartData(plot.id + '-values', this.analysisService.normalizeLocationValues(plot));
  }

  /*
   * Send message (select plot) via LocalStorageService
   */
  private sendSelectPlot(plot: Plot): void {
    const locationValues = new RadarChartData(
      plot.id + '-values',
      this.analysisService.normalizeLocationValues(plot)
    );
    this.localStorageService.sendSelectPlot(plot, locationValues);
  }

  /*
   * Send message (set top plots) via LocalStorageService
   */
  private sendTopPlots(): void {
    const chartData = this.analysisService.topPlots.map(plot => new RadarChartData(
      plot.id + '-values',
      this.analysisService.normalizeLocationValues(plot)
    ));
    this.localStorageService.sendSetTopPlots(this.analysisService.topPlots, chartData);
  }
}
