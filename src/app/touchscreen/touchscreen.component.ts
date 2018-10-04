import { Component, OnInit } from '@angular/core';
import { TuioClient } from 'tuio-client';

import { environment } from '../../environments/environment';
import { ConfigurationService } from '../configuration.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { MapService } from '../map/map.service';
import { AnalysisService } from '../analysis.service';
import { Feature } from '../feature.model';
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
  private lastSelectedFeature: Feature;
  private activeMarkers: number[] = [];
  private computerBleeped = false;
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

    if (step === 5 && !this.computerBleeped) {
      const winnerFeature = this.analysisService.computerSagt();
      this.computerBleeped = true;
      this.mapService.zoomToFeature(winnerFeature.olFeature, 13, 17);
      this.localStorageService.sendComputerSagt(
        winnerFeature,
        this.featureToRadarChartData(winnerFeature)
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
    // The selection marker queries and locks features on the map (step 3)
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
        this.computerBleeped = false;
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
        const changedFeature = this.mapService.getSelectedFeatures(coordinate)[0];

        if (changedFeature) {
          this.mapService.dispatchSelectEvent(this.sitesLayer, [changedFeature], coordinate);

          this.initialAngle = object.aAngle;
          this.initialLocked = !!this.analysisService.findTopFeatureById(changedFeature.getId());
          this.initialLocked = false;
        }
        if (!this.lastSelectedFeature) {
          return;
        }

        // Make sure the lock mechanism only works while the marker is near the geometry
        if (!this.mapService.featureBufferContainsCoordinate(this.lastSelectedFeature.olFeature, coordinate)) {
          return;
        }

        const featureIsTopFeature = !!this.analysisService.findTopFeatureById(this.lastSelectedFeature.id);

        // Lock/unlock at a 1/4 marker rotation clockwise or anticlockwise
        let relativeAngle = object.aAngle - this.initialAngle + Math.PI / 2;
        if (relativeAngle < 0) {
          relativeAngle += 2 * Math.PI;
        }
        const doChange = relativeAngle >= Math.PI;

        if (this.initialLocked && featureIsTopFeature && doChange ||
          !this.initialLocked && featureIsTopFeature && !doChange) {
          this.analysisService.topFeatures.splice(this.analysisService.topFeatures.indexOf(this.lastSelectedFeature), 1);
          this.analysisService.unlockFeature(this.lastSelectedFeature);
        }
        if (this.initialLocked && !featureIsTopFeature && !doChange ||
          !this.initialLocked && !featureIsTopFeature && doChange) {
          this.analysisService.topFeatures.push(this.lastSelectedFeature);
          this.analysisService.lockFeature(this.lastSelectedFeature);
        }

        this.localStorageService.sendSetTopFeatures(
          this.analysisService.topFeatures,
          this.analysisService.topFeatures.map(this.featureToRadarChartData, this)
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

  findCriterionByMarkerId(markerId: number) {
    return this.config.searchCriteria.find(item => item.markerID === markerId);
  }

  featureToRadarChartData(feature: Feature) {
    return new RadarChartData(feature.id + '-values', this.analysisService.normalizeLocationValues(feature));
  }
}
