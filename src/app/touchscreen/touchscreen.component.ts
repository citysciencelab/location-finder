import { Component, OnInit } from '@angular/core';
import { TuioClient } from 'tuio-client';
import * as olcs from 'ol-cityscope';

import { environment } from '../../environments/environment';
import { ConfigurationService } from '../configuration.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { AnalysisService } from '../analysis.service';
import { Plot } from '../plot.model';
import { RadarChartData } from '../radar-chart/radar-chart-data.model';
import { RadarChartAxis } from '../radar-chart/radar-chart-axis.model';
import { MarkerType } from '../marker-type.enum';

@Component({
  selector: 'app-touchscreen',
  templateUrl: './touchscreen.component.html',
  styleUrls: ['./touchscreen.component.css']
})
export class TouchscreenComponent implements OnInit {
  steps = [1, 2, 3, 4, 5];
  currentStep: number;
  showCanvas: boolean;
  showSliders: boolean;
  private initialAngle: number;
  private lastSelectedPlot: Plot;
  private bestPlot: Plot;
  private activeMarkers: number[] = [];
  private sitesLayer: MapLayer;

  constructor(private config: ConfigurationService, private localStorageService: LocalStorageService, private tuioClient: TuioClient,
    private map: olcs.Map, private analysisService: AnalysisService) { }

  ngOnInit() {
    this.sitesLayer = this.map.getTopicLayerByName('sites');

    if (this.config.enableTuio) {
      this.tuioClient.connect(environment.socketUrl);
    }
  }

  setStep(step: number) {
    if (isNaN(step)) {
      return;
    }

    if (step !== this.currentStep) {
      this.currentStep = step;
      this.showCanvas = this.config.enableTuio && step === 2;
      this.showSliders = !this.config.enableTuio && step === 2;
      this.localStorageService.sendSetProgress(step);
    }

    if (step === 5 && !this.bestPlot) {
      this.bestPlot = this.analysisService.getBestPlot();
      this.zoomTo(this.bestPlot.centerpoint, 13, 17);
      this.localStorageService.sendComputerSagt(
        this.bestPlot,
        this.plotToRadarChartData(this.bestPlot)
      );
    }
  }

  /*
   * When a TUIO object is added
   */
  onAddObject(evt: CustomEvent) {
    evt.stopPropagation();

    const object = evt.detail;

    this.activeMarkers.push(object.classId);
  }

  /*
   * When a TUIO object is updated
   */
  onUpdateObject(evt: CustomEvent) {
    evt.stopPropagation();

    const target = <Element>evt.target;
    const object = evt.detail;

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

        const coordinate = this.map.getCoordinateFromXY(object.xPosition, object.yPosition);
        if (!coordinate) {
          return;
        }

        const selected = this.map.getSelectedFeatures(coordinate)[0];
        if (!selected) {
          return;
        }

        // If a plot is selected that hasn't been selected before ...
        if (selected && !this.lastSelectedPlot || selected && selected.getId() !== this.lastSelectedPlot.id) {
          this.map.dispatchSelectEvent(this.sitesLayer, [selected], coordinate);
          this.initialAngle = object.aAngle;
        }
        if (!this.lastSelectedPlot) {
          return;
        }

        // Make sure the lock mechanism only works while the marker is near the geometry
        if (!this.map.featureBufferContainsCoordinate(this.lastSelectedPlot.id, coordinate)) {
          return;
        }

        // Lock/unlock at a 1/4 marker rotation clockwise or anticlockwise
        // (this is the case when the change of angle exceeds PI/2 in either direction)
        const relativeAngle = object.aAngle - this.initialAngle;

        if (relativeAngle >= Math.PI / 2 || relativeAngle < -Math.PI / 2) {
          this.onToggleLockFeature(selected);
          // reset
          this.initialAngle = object.aAngle;
        }
    }
  }

  /*
   * When a TUIO object is removed
   */
  onRemoveObject(evt: CustomEvent) {
    evt.stopPropagation();

    const object = evt.detail;

    if (evt.type === 'removeobject') {
      this.activeMarkers = this.activeMarkers.filter(item => item !== object.classId);
    }
  }

  onSliderInput(axis: RadarChartAxis, evt: Event) {
    axis.sliderValue = parseInt((<HTMLInputElement>evt.target).value, 10);
    axis.value = axis.sliderValue / this.analysisService.maxValues[axis.name];
    this.sendSetCriteria();
  }

  onSelectFeature(olFeature: ol.Feature) {
    const featureId = olFeature.getId();
    if (this.analysisService.topPlots.find(item => item.id === featureId)) {
      this.map.applyExtraStyle(featureId, this.sitesLayer);
    } else {
      this.map.applySelectedStyle(featureId, this.sitesLayer);
    }

    const plot = this.analysisService.allPlots.find(item => item.id === featureId);
    this.lastSelectedPlot = plot;
    this.sendSelectPlot(plot);
  }

  onDeselectFeatures(olFeatures: ol.Feature[]) {
    olFeatures.forEach(olFeature => {
      const featureId = olFeature.getId();
      if (this.analysisService.topPlots.find(item => item.id === featureId)) {
        this.map.applyExtraStyle(featureId, this.sitesLayer);
      } else {
        this.map.applyDefaultStyle(featureId, this.sitesLayer);
      }
    });
  }

  onToggleLockFeature(olFeature: ol.Feature) {
    const featureId = olFeature.getId();
    const plot = this.analysisService.findPlotById(featureId);
    const locked = !!this.analysisService.findTopPlotById(featureId);

    if (locked) {
      this.analysisService.unlockPlot(plot);
      this.map.applySelectedStyle(featureId, this.sitesLayer);
    } else {
      this.analysisService.lockPlot(plot);
      this.map.applyExtraStyle(featureId, this.sitesLayer);
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
   * Send message (set criteria) via LocalStorageService
   */
  private sendSetCriteria(): void {
    this.localStorageService.sendSetCriteria(this.analysisService.targetCriteria);
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

  /*
   * Zoom out, fly to the feature, zoom in
   */
  zoomTo(coordinate: ol.Coordinate, zoom1: number, zoom2: number): void {
    this.map.getView().animate(
      { zoom: zoom1 },
      { center: coordinate },
      { zoom: zoom2 }
    );
  }
}
