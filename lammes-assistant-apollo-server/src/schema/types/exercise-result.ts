import {enumType} from "@nexus/schema";

export const ExerciseResult = enumType({
  name: 'ExerciseResult',
  members: ['FAILURE', 'SUCCESS'],
  description: 'Results describing how a learner coped with an exercise. Through the use of an enum we make sure that further characteristics can easily added in the future.',
});
