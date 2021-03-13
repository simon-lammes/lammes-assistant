import {objectType} from "@nexus/schema";

export const GroupNote = objectType({
    name: 'GroupNote',
    definition(t) {
        t.model.noteId();
        t.model.groupId();
        t.model.protectionLevel();
    }
});
