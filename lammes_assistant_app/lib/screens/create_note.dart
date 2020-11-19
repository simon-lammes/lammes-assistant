import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

class CreateNoteScreen extends StatefulWidget {
  @override
  _CreateNoteScreenState createState() => _CreateNoteScreenState();
}

class _CreateNoteScreenState extends State<CreateNoteScreen> {
  final String createNoteMutation = """
    mutation CreateNote(\$text: String!) {
      createNote(text: \$text) {
        id,
        text
      }
    }
  """;
  final _formKey = GlobalKey<FormState>();
  final _textController = TextEditingController();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Create Note'),
      ),
      body: Form(
        key: _formKey,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              TextFormField(
                autofocus: true,
                controller: _textController,
                validator: (value) {
                  if (value.isEmpty) {
                    return 'Please enter some text';
                  }
                  return null;
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                child: Mutation(
                  options: MutationOptions(
                    document: gql(createNoteMutation),
                    onCompleted: (data) {
                      print(data);
                    },
                    onError: (error) {
                      throw error;
                    },
                  ),
                  builder: (
                      RunMutation runMutation,
                      QueryResult result,
                      ) {
                    return ElevatedButton(
                      child: Text('Submit'),
                      onPressed: () {
                        if (!_formKey.currentState.validate()) {
                          Scaffold.of(context)
                              .showSnackBar(SnackBar(content: Text('Please review your inputs.')));
                          return;
                        }
                        runMutation({
                          'text': _textController.value.text
                        });
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
