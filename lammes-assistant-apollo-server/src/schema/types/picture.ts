import {inputObjectType, objectType} from "@nexus/schema";

export const PictureInputType = inputObjectType({
  name: 'PictureInput',
  definition(t) {
    t.nonNull.string('name', {description: 'the name of the picture'});
    t.nonNull.string('type', {description: 'the file type of the picture'})
    t.nonNull.string('content', {description: 'The content of the image encoded in base64.'});
  },
});
