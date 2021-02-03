import {Component, Input, OnInit} from '@angular/core';

export interface ValidationAspect {
  description: string;
  valid: boolean;
}

@Component({
  selector: 'app-validation-feedback',
  templateUrl: './validation-feedback.component.html',
  styleUrls: ['./validation-feedback.component.scss'],
})
export class ValidationFeedbackComponent implements OnInit {

  @Input()
  validationAspects: ValidationAspect[];

  constructor() { }

  ngOnInit() {}

}
