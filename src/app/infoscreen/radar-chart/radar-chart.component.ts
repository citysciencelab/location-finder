/*
 * Modified from source: https://github.com/alangrafu/radar-chart-d3
 * License: Apache License 2.0
 * Copyright 2012 Alvaro Graves
 */

import { Component, ElementRef, Input, OnChanges, Inject, LOCALE_ID } from '@angular/core';
import { ConfigurationService } from '../../configuration.service';
import * as d3 from 'd3';
import { RadarChartAxis } from './radar-chart-axis.model';
import { RadarChartData } from './radar-chart-data.model';
import { RadarChartOptions } from './radar-chart-options.model';

@Component({
  selector: 'app-radar-chart',
  templateUrl: './radar-chart.component.html',
  styleUrls: ['./radar-chart.component.css']
})
export class RadarChartComponent implements OnChanges {
  @Input() private className: string;
  @Input() private chartDatas: RadarChartData[] = [];
  @Input() private chartOptions: RadarChartOptions = {};

  private defaultConfig: RadarChartOptions = {
    containerClass: 'radar-chart',
    w: 600,
    h: 600,
    factor: 0.95,
    factorLegend: 1,
    levels: 3,
    levelTick: false,
    tickLength: 10,
    maxValue: 0,
    minValue: 0,
    radians: 2 * Math.PI,
    color: d3.scale.category10(),
    axisLine: true,
    axisText: true,
    circles: true,
    radius: 5,
    backgroundTooltipColor: '#555',
    backgroundTooltipOpacity: '0.7',
    tooltipColor: 'white',
    axisJoin: (d: RadarChartData, i: number) => d.className || i.toString(),
    tooltipFormatValue: (d: number) => d.toString(),
    tooltipFormatClass: (d: string) => d,
    transitionDuration: 300
  };
  private svgSelection: d3.Selection<SVGElement>;
  private total: number;

  constructor(@Inject(LOCALE_ID) private locale, private elementRef: ElementRef, private config: ConfigurationService) {
    this.setOptions();
    this.svgSelection = d3.select(this.elementRef.nativeElement).append('svg');
  }

  setOptions() {
    for (const [key, value] of Object.entries(this.defaultConfig)) {
      if (!this.chartOptions.hasOwnProperty(key) || this.chartOptions[key] === undefined) {
        this.chartOptions[key] = value;
      }
    }
  }

  setTooltip(tooltip: d3.Selection<RadarChartData>, msg: string | boolean) {
    if (msg === false || msg === undefined) {
      tooltip.classed('visible', false);
      tooltip.select('rect').classed('visible', false);
    } else {
      tooltip.classed('visible', true);

      const container = tooltip.node().parentNode;
      const coords = d3.mouse(container);

      tooltip.select('text').classed('visible', true).style('fill', this.chartOptions.tooltipColor);
      const padding = 5;
      const bbox = (<SVGGraphicsElement>tooltip.select('text').text(msg).node()).getBBox();

      tooltip.select('rect')
        .classed('visible', false).attr('x', 0)
        .attr('x', bbox.x - padding)
        .attr('y', bbox.y - padding)
        .attr('width', bbox.width + (padding * 2))
        .attr('height', bbox.height + (padding * 2))
        .attr('rx', '5').attr('ry', '5')
        .style('fill', this.chartOptions.backgroundTooltipColor)
        .style('opacity', this.chartOptions.backgroundTooltipOpacity);
      tooltip.attr('transform', 'translate(' + (coords[0] + 10) + ',' + (coords[1] - 10) + ')');
    }
  }

  getPosition(i, range, factor, func) {
    factor = typeof factor !== 'undefined' ? factor : 1;
    return range * (1 - factor * func(i * this.chartOptions.radians / this.total));
  }

  getHorizontalPosition(i, range, factor?) {
    return this.getPosition(i, range, factor, Math.sin);
  }

  getVerticalPosition(i, range, factor?) {
    return this.getPosition(i, range, factor, Math.cos);
  }

  radar(selection: d3.Selection<RadarChartData[]>) {
    const cfg = this.chartOptions;

    selection.each(data => {
      data = data.filter(d => d !== undefined);
      if (data.length === 0) {
        return;
      }

      const container = this.svgSelection;
      const tooltip = container.selectAll('g.tooltip').data([data[0]]);

      const tt = tooltip.enter()
        .append('g')
        .classed('tooltip', true);

      tt.append('rect').classed('tooltip', true);
      tt.append('text').classed('tooltip', true);

      let maxValue = Math.max(cfg.maxValue, d3.max(data, d => {
        return d3.max(d.axes, o => o.value);
      }));
      maxValue -= cfg.minValue;

      const allAxis = data[0].axes.map((i, j) => {
        return { name: i.name, xOffset: (i.xOffset) ? i.xOffset : 0, yOffset: (i.yOffset) ? i.yOffset : 0 };
      });
      const total = this.total = allAxis.length;
      const radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
      const radius2 = Math.min(cfg.w / 2, cfg.h / 2);

      container.classed(cfg.containerClass, true);

      // levels && axises
      const levelFactors = d3.range(0, cfg.levels).map(level => {
        return radius * ((level + 1) / cfg.levels);
      });

      const levelGroups = container.selectAll('g.level-group').data(levelFactors);

      levelGroups.enter().append('g');
      levelGroups.exit().remove();

      levelGroups.attr('class', (d, i) => {
        return 'level-group level-group-' + i;
      });

      const levelLine = levelGroups.selectAll('.level').data(levelFactor => {
        return d3.range(0, total).map(() => levelFactor);
      });

      levelLine.enter().append('line');
      levelLine.exit().remove();

      if (cfg.levelTick) {
        levelLine
          .attr('class', 'level')
          .attr('x1', (levelFactor, i) => {
            if (radius === levelFactor) {
              return this.getHorizontalPosition(i, levelFactor);
            } else {
              return this.getHorizontalPosition(i, levelFactor) + (cfg.tickLength / 2) * Math.cos(i * cfg.radians / total);
            }
          })
          .attr('y1', (levelFactor, i) => {
            if (radius === levelFactor) {
              return this.getVerticalPosition(i, levelFactor);
            } else {
              return this.getVerticalPosition(i, levelFactor) - (cfg.tickLength / 2) * Math.sin(i * cfg.radians / total);
            }
          })
          .attr('x2', (levelFactor, i) => {
            if (radius === levelFactor) {
              return this.getHorizontalPosition(i + 1, levelFactor);
            } else {
              return this.getHorizontalPosition(i, levelFactor) - (cfg.tickLength / 2) * Math.cos(i * cfg.radians / total);
            }
          })
          .attr('y2', (levelFactor, i) => {
            if (radius === levelFactor) {
              return this.getVerticalPosition(i + 1, levelFactor);
            } else {
              return this.getVerticalPosition(i, levelFactor) + (cfg.tickLength / 2) * Math.sin(i * cfg.radians / total);
            }
          })
          .attr('transform', (levelFactor) => {
            return 'translate(' + (cfg.w / 2 - levelFactor) + ', ' + (cfg.h / 2 - levelFactor) + ')';
          });
      } else {
        levelLine
          .attr('class', 'level')
          .attr('x1', (levelFactor, i) => this.getHorizontalPosition(i, levelFactor))
          .attr('y1', (levelFactor, i) => this.getVerticalPosition(i, levelFactor))
          .attr('x2', (levelFactor, i) => this.getHorizontalPosition(i + 1, levelFactor))
          .attr('y2', (levelFactor, i) => this.getVerticalPosition(i + 1, levelFactor))
          .attr('transform', levelFactor => {
            return 'translate(' + (cfg.w / 2 - levelFactor) + ', ' + (cfg.h / 2 - levelFactor) + ')';
          });
      }
      if (cfg.axisLine || cfg.axisText) {
        const axis = <d3.selection.Update<RadarChartAxis>>container.selectAll('.axis').data(allAxis);

        const newAxis = axis.enter().append('g');
        if (cfg.axisLine) {
          newAxis.append('line');
        }
        if (cfg.axisText) {
          newAxis.append('text');
        }

        axis.exit().remove();

        axis.attr('class', 'axis');

        if (cfg.axisLine) {
          axis.select('line')
            .attr('x1', cfg.w / 2)
            .attr('y1', cfg.h / 2)
            .attr('x2', (d, i) => (cfg.w / 2 - radius2) + this.getHorizontalPosition(i, radius2, cfg.factor))
            .attr('y2', (d, i) => (cfg.h / 2 - radius2) + this.getVerticalPosition(i, radius2, cfg.factor));
        }

        if (cfg.axisText) {
          axis.select('text')
            .attr('class', (d, i) => {
              const p = this.getHorizontalPosition(i, 0.5);

              return 'legend ' +
                ((p < 0.4) ? 'left' : ((p > 0.6) ? 'right' : 'middle'));
            })
            .attr('dy', (d, i) => {
              const p = this.getVerticalPosition(i, 0.5);
              return ((p < 0.1) ? '1em' : ((p > 0.9) ? '0' : '0.5em'));
            })
            // TODO possible to use i18n here?
            .text(d => this.config.getSearchCriterionByKey(d.name)['name_' + this.locale])
            .attr('x', (d, i) => d.xOffset + (cfg.w / 2 - radius2) + this.getHorizontalPosition(i, radius2, cfg.factorLegend))
            .attr('y', (d, i) => d.yOffset + (cfg.h / 2 - radius2) + this.getVerticalPosition(i, radius2, cfg.factorLegend));
        }
      }

      // content
      data.forEach(d => {
        d.axes.forEach((axis, i) => {
          axis.x = (cfg.w / 2 - radius2)
            + this.getHorizontalPosition(i, radius2, (Math.max(axis.value - cfg.minValue, 0) / maxValue) * cfg.factor);
          axis.y = (cfg.h / 2 - radius2)
            + this.getVerticalPosition(i, radius2, (Math.max(axis.value - cfg.minValue, 0) / maxValue) * cfg.factor);
        });
      });

      const polygon = container.selectAll('.area').data(data, cfg.axisJoin);

      polygon.enter().append('polygon')
        .classed({ area: true, 'd3-enter': true })
        .on('mouseover', dd => {
          (<Event>d3.event).stopPropagation();
          container.classed('focus', true);
          this.svgSelection.classed('focused', true);
          this.setTooltip(tooltip, cfg.tooltipFormatClass(dd.className));
        })
        .on('mouseout', () => {
          (<Event>d3.event).stopPropagation();
          container.classed('focus', false);
          this.svgSelection.classed('focused', false);
          this.setTooltip(tooltip, false);
        });

      polygon.exit()
        .classed('d3-exit', true) // trigger css transition
        .transition().duration(cfg.transitionDuration)
        .remove();

      polygon
        .each((d, i) => {
          const classed = { 'd3-exit': false }; // if exiting element is being reused
          classed['radar-chart-serie' + i] = true;
          if (d.className) {
            classed[d.className] = true;
          }
          this.svgSelection.classed(classed);
        })
        // styles should only be transitioned with css
        .style('stroke', (d, i) => cfg.color(i.toString()))
        .style('fill', (d, i) => cfg.color(i.toString()))
        .transition().duration(cfg.transitionDuration)
        // svg attrs with js
        .attr('points', d => {
          return d.axes.map(p => {
            return [p.x, p.y].join(',');
          }).join(' ');
        })
        .each('start', () => {
          this.svgSelection.classed('d3-enter', false); // trigger css transition
        });

      if (cfg.circles && cfg.radius) {

        const circleGroups = container.selectAll('g.circle-group').data(data, cfg.axisJoin);

        circleGroups.enter().append('g').classed({ 'circle-group': true, 'd3-enter': true });
        circleGroups.exit()
          .classed('d3-exit', true) // trigger css transition
          .transition().duration(cfg.transitionDuration).remove();

        circleGroups
          .each(d => {
            const classed = { 'd3-exit': false }; // if exiting element is being reused
            if (d.className) {
              classed[d.className] = true;
            }
            this.svgSelection.classed(classed);
          })
          .transition().duration(cfg.transitionDuration)
          .each('start', () => {
            this.svgSelection.classed('d3-enter', false); // trigger css transition
          });

        const circle = circleGroups.selectAll('.circle').data((datum, i) => {
          return datum.axes.map(d => ({0: d, 1: i}));
        });

        circle.enter().append('circle')
          .classed({ circle: true, 'd3-enter': true })
          .on('mouseover', dd => {
            (<Event>d3.event).stopPropagation();
            this.setTooltip(tooltip, cfg.tooltipFormatValue(dd[0].value));
            // container.classed('focus', 1);
            // container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 1);
          })
          .on('mouseout', dd => {
            (<Event>d3.event).stopPropagation();
            this.setTooltip(tooltip, false);
            container.classed('focus', false);
            // container.select('.area.radar-chart-serie'+dd[1]).classed('focused', 0);
            // No idea why previous line breaks tooltip hovering area after hoverin point.
          });

        circle.exit()
          .classed('d3-exit', true) // trigger css transition
          .transition().duration(cfg.transitionDuration).remove();

        circle
          .each(d => {
            const classed = { 'd3-exit': false }; // if exit element reused
            classed['radar-chart-serie' + d[1]] = true;
            this.svgSelection.classed(classed);
          })
          // styles should only be transitioned with css
          .style('fill', d => cfg.color(d[1].toString()))
          .transition().duration(cfg.transitionDuration)
          // svg attrs with js
          .attr('r', cfg.radius)
          .attr('cx', d => d[0].x)
          .attr('cy', d => d[0].y)
          .each('start', () => {
            this.svgSelection.classed('d3-enter', false); // trigger css transition
          });

        // Make sure layer order is correct
        const poly_node = polygon.node();
        poly_node.parentNode.appendChild(poly_node);

        const cg_node = circleGroups.node();
        cg_node.parentNode.appendChild(cg_node);

        // ensure tooltip is upmost layer
        const tooltipEl = tooltip.node();
        tooltipEl.parentNode.appendChild(tooltipEl);
      }
    });
  }

  ngOnChanges() {
    this.setOptions();

    this.svgSelection
      .attr('width', this.chartOptions.w)
      .attr('height', this.chartOptions.h)
      .datum(this.chartDatas)
      .call(this.radar.bind(this));
  }

}
