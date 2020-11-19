import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

class NotesScreen extends StatelessWidget {
  final String myNotesQuery = """
  query {
    myNotes {
      text
    }
  }
  """;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Query(
          options: QueryOptions(document: gql(myNotesQuery)),
          builder: (result, {fetchMore, refetch}) {
            if (result.hasException) {
              return Text(result.exception.toString());
            }
            if (result.isLoading) {
              return Text("Loading...");
            }
            final List notes = result.data['myNotes'];
            return ListView.builder(
              itemCount: notes.length,
              itemBuilder: (context, index) {
                final dynamic note = notes[index];
                final text = note['text'];
                return ListTile(
                  title: Text(text),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
