import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild,
  Inject, LOCALE_ID } from '@angular/core';
import { ConfigurationService } from '../configuration.service';
import { RadarChartData } from '../radar-chart/radar-chart-data.model';
import { AnalysisService } from '../analysis.service';

@Component({
  selector: 'app-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnChanges {
  @ViewChild('tuioCanvas', { static: false }) canvasRef: ElementRef;
  @ViewChild('mainContainer', { static: false }) mainContainerRef: ElementRef;
  width = 0;
  height = 0;
  private ctx: CanvasRenderingContext2D;
  private knobPositions: number[][];
  @Input() private targetCriteria: RadarChartData;
  @Input() private activeMarkers: number[] = [];

  constructor(@Inject(LOCALE_ID) private locale, private config: ConfigurationService, private analysisService: AnalysisService) { }

  ngOnChanges() {
    this.refresh();
  }

  ngAfterViewInit() {
    this.refresh();
  }

  refresh() {
    if (!this.mainContainerRef || !this.targetCriteria) {
      return;
    }

    // Dynamically size the canvas so it matches the main-container div
    this.width = this.mainContainerRef.nativeElement.offsetWidth;
    this.height = this.mainContainerRef.nativeElement.offsetHeight;

    this.knobPositions = [
      [this.width * 1 / 4, this.height * 1 / 3],
      [this.width * 1 / 2, this.height * 1 / 3],
      [this.width * 3 / 4, this.height * 1 / 3],
      [this.width * 1 / 4, this.height * 2 / 3],
      [this.width * 1 / 2, this.height * 2 / 3],
      [this.width * 3 / 4, this.height * 2 / 3]
    ];

    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    this.ctx.font = '16px sans-serif';

    this.draw(this.targetCriteria);
  }

  draw(data: RadarChartData) {
    if (!this.ctx) {
      throw new Error('No rendering context');
    }
    if (!this.knobPositions) {
      throw new Error('Knob positions unknown');
    }

    const size = 50,
      offsetX = -15,
      offsetY = 6;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (const [i, criterion] of this.config.searchCriteria.entries()) {
      // Origin is the center of the knob
      this.ctx.save();
      this.ctx.translate(this.knobPositions[i][0], this.knobPositions[i][1]);

      // arc
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 1.5 * size, -Math.PI, 0, false);
      this.ctx.stroke();

      // labels
      this.ctx.fillText('min', -2 * size + offsetX, offsetY);
      this.ctx.fillText('max', 2 * size + offsetX, offsetY);
      // TODO possible to use i18n here?
      this.ctx.fillText(criterion['name_' + this.locale], -2 * size + offsetX, -2 * size + offsetY);

      const currentAxis = data.axes.find(axis => axis.name === criterion.key);
      const normalizedValue = currentAxis.value;
      const absoluteValue = Math.floor(normalizedValue * this.analysisService.maxValues[criterion.key]);
      if (!isNaN(absoluteValue)) {
        this.ctx.fillText(absoluteValue.toString(), offsetX, size + offsetY);
      }

      // knob
      this.ctx.rotate((Math.max(0, Math.min(1, normalizedValue)) - 0.5) * Math.PI);

      if (this.activeMarkers && this.activeMarkers.indexOf(criterion.markerID) > -1) {
        this.ctx.fillStyle = this.ctx.strokeStyle = 'rgba(' + criterion.color + ', 1)';
        this.ctx.fillRect(-size / 2, -size / 2, size, size);
      } else {
        this.ctx.fillStyle = this.ctx.strokeStyle = 'rgba(' + criterion.color + ', 0.5)';
        this.ctx.strokeRect(-size / 2, -size / 2, size, size);
      }
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size / 2);
      this.ctx.lineTo(0, -size * 1.5);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }
}
