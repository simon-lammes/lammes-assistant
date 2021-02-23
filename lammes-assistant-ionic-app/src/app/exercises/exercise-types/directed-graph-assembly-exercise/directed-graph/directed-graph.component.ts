import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-directed-graph',
  templateUrl: './directed-graph.component.html',
  styleUrls: ['./directed-graph.component.scss'],
})
export class DirectedGraphComponent {
  @Input()
  nodes: any[];

  @Input()
  edges: any[];
}
