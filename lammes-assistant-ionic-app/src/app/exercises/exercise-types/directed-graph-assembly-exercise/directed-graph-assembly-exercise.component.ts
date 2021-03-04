import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {ExerciseResult, HydratedExercise} from '../../../shared/services/exercise/exercise.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {CustomFormsService} from '../../../shared/services/custom-forms.service';

@Component({
  selector: 'app-directed-graph-assembly-exercise',
  templateUrl: './directed-graph-assembly-exercise.component.html',
  styleUrls: ['./directed-graph-assembly-exercise.component.scss'],
})
export class DirectedGraphAssemblyExerciseComponent implements OnChanges {

  constructor(
    private fb: FormBuilder,
    private customFormsService: CustomFormsService
  ) {
  }
  @Input()
  exercise: HydratedExercise;

  @Output()
  exerciseResultChanged = new EventEmitter<ExerciseResult>();

  edges: any[];
  nodes: any[];
  edgeLabels: string[];

  exerciseResult: ExerciseResult;
  userCreatedEdges: any[];
  addEdgeForm: FormGroup;

  private static areEdgesEqual(one, other) {
    return one.source === other.source
      && one.label && other.label
      && one.target === other.target;
  }

  ngOnChanges() {
    // When the exercise has changed, reset.
    this.exerciseResult = undefined;
    this.addEdgeForm = this.fb.group({
      source: this.fb.control(null, [Validators.required]),
      label: this.fb.control(null, [Validators.required]),
      target: this.fb.control(null, [Validators.required])
    });
    this.userCreatedEdges = [];
    this.nodes = this.exercise.nodes.map(node => {
      return {
        ...node,
        id: 'id-' + node.id
      };
    });
    this.edges = this.exercise.edges.map(edge => {
      return {
        ...edge,
        id: 'id-' + edge.id,
        source: 'id-' + edge.source,
        target: 'id-' + edge.target
      };
    });
    this.edgeLabels = [...new Set(this.edges.map(edge => edge.label))];
  }

  validateUsersAnswer() {
    const isCorrect = this.userCreatedEdges.length === this.edges.length &&
      this.userCreatedEdges.every(userCreatedEdge =>
        this.edges.some(edge => DirectedGraphAssemblyExerciseComponent.areEdgesEqual(edge, userCreatedEdge)));
    this.exerciseResult = isCorrect ? 'SUCCESS' : 'FAILURE';
    this.exerciseResultChanged.emit(this.exerciseResult);
    this.addEdgeForm.disable();
  }

  trim(control: FormControl) {
    this.customFormsService.trim(control);
  }

  addEdge() {
    const newEdge = this.addEdgeForm.value;
    this.userCreatedEdges = [...this.userCreatedEdges, newEdge];
    this.addEdgeForm.reset();
  }

  getNodeById(id: string) {
    return this.nodes.find(node => node.id === id);
  }

  removeEdge(id: number) {
    this.userCreatedEdges = this.userCreatedEdges.filter(edge => edge.id !== id);
  }

  isAddEdgeFormValueADuplicate() {
    const newEdge = this.addEdgeForm.value;
    return this.userCreatedEdges.some(edge =>
      DirectedGraphAssemblyExerciseComponent.areEdgesEqual(edge, newEdge)
    );
  }
}
