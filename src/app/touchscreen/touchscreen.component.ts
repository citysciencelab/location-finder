import { Component, OnInit } from '@angular/core';
import { TuioClient } from 'tuio-client';
import { environment } from '../../environments/environment';
import { ConfigurationService } from '../configuration.service';
import { LocalStorageService } from '../local-storage.service';
import { MapService } from '../map.service';
import { RadarChartData } from '../infoscreen/radar-chart/radar-chart-data.model';
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
  private targetCriteria: RadarChartData;
  private activeMarkers: number[] = [];
  private computerBleeped = false;

  constructor(private config: ConfigurationService, private localStorageService: LocalStorageService, private tuioClient: TuioClient,
    private mapService: MapService) {
    this.targetCriteria = new RadarChartData(
      'target-values',
      this.config.searchCriteria.map(item => ({ name: item.key, value: 0 }))
    );
  }

  ngOnInit() {
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
      const winnerFeature = this.computerSagt();
      this.computerBleeped = true;
      this.mapService.zoomTo(winnerFeature);
      this.localStorageService.sendComputerSagt(
        this.mapService.featureToJSON(winnerFeature),
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
        const currentAxis = this.targetCriteria.findAxisByKey(adjustableCriterion.key);
        currentAxis.value = Math.max(0, Math.min(1, object.aAngle / Math.PI - 0.5));
        this.targetCriteria = new RadarChartData(this.targetCriteria.className, this.targetCriteria.axes);
        this.localStorageService.sendSetCriteria(this.targetCriteria);
        break;

      case MarkerType.select:
        if (this.currentStep !== 3) {
          break;
        }
        const coordinate = this.mapService.getCoordinateFromXY(object.xPosition, object.yPosition);
        if (!coordinate) {
          return;
        }
        const changedFeature = this.mapService.onSelectMapFeature(coordinate);

        if (changedFeature) {
          this.initialAngle = object.aAngle;
          this.initialLocked = !!this.mapService.findTopFeatureById(changedFeature.getId());
        }
        if (!this.mapService.lastSelectedFeature) {
          return;
        }

        // Make sure the lock mechanism only works while the marker is near the geometry
        if (!this.mapService.featureBufferContainsCoordinate(this.mapService.lastSelectedFeature, coordinate)) {
          return;
        }

        const featureIsTopFeature = !!this.mapService.findTopFeatureById(this.mapService.lastSelectedFeature.getId());

        // Lock/unlock at a 1/4 marker rotation clockwise or anticlockwise
        let relativeAngle = object.aAngle - this.initialAngle + Math.PI / 2;
        if (relativeAngle < 0) {
          relativeAngle += 2 * Math.PI;
        }
        const doChange = relativeAngle >= Math.PI;

        if (this.initialLocked && featureIsTopFeature && doChange ||
          !this.initialLocked && featureIsTopFeature && !doChange) {
          this.mapService.topFeatures.splice(this.mapService.topFeatures.indexOf(this.mapService.lastSelectedFeature), 1);
          this.mapService.unlockFeature(this.mapService.lastSelectedFeature);
        }
        if (this.initialLocked && !featureIsTopFeature && !doChange ||
          !this.initialLocked && !featureIsTopFeature && doChange) {
          this.mapService.topFeatures.push(this.mapService.lastSelectedFeature);
          this.mapService.lockFeature(this.mapService.lastSelectedFeature);
        }

        this.localStorageService.sendSetTopFeatures(
          this.mapService.topFeatures.map(this.mapService.featureToJSON, this.mapService),
          this.mapService.topFeatures.map(this.featureToRadarChartData, this)
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

  featureToRadarChartData(feature: ol.Feature) {
    return new RadarChartData(feature.getId() + '-values', this.mapService.normalizeLocationValues(feature));
  }

  /*
   * Returns the feature whose properties exhibit the greatest similarity with the targetCriteria
   */
  computerSagt() {
    let minEuclideanDistance = Infinity;
    let topFeature: ol.Feature;

    for (const feature of this.mapService.allFeatures) {
      const normalizedValues = this.mapService.normalizeLocationValues(feature);
      const sum = normalizedValues
        .map(axis => {
          const targetAxis = this.targetCriteria.findAxisByKey(axis.name);
          return Math.pow(axis.value - targetAxis.value, 2);
        })
        .reduce((previous, current) => previous + current, 0);
      const euclideanDistance = Math.sqrt(sum);

      if (euclideanDistance < minEuclideanDistance) {
        minEuclideanDistance = euclideanDistance;
        topFeature = feature;
      }
    }

    return topFeature;
  }
}
