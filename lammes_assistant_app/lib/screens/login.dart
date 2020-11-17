import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:lammes_assistant_app/state/authentication_state.dart';
import 'package:provider/provider.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();
  final passwordFocusNode = FocusNode();
  final String loginMutation = """
    mutation Login(\$username: String!, \$password: String!) {
      login(username: \$username, password: \$password)
    }
  """;

  @override
  void dispose() {
    usernameController.dispose();
    passwordController.dispose();
    passwordFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Center(
          child: Container(
            padding: EdgeInsets.all(30),
            decoration: BoxDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                FlutterLogo(
                  size: 150,
                ),
                TextField(
                  decoration: InputDecoration(hintText: 'Username'),
                  autofocus: true,
                  controller: usernameController,
                  textInputAction: TextInputAction.next,
                  onEditingComplete: () => passwordFocusNode.requestFocus(),
                ),
                TextField(
                  decoration: InputDecoration(hintText: 'Password'),
                  textInputAction: TextInputAction.done,
                  focusNode: passwordFocusNode,
                  controller: passwordController,
                ),
                Mutation(
                  options: MutationOptions(
                    document: gql(loginMutation),
                    update: (GraphQLDataProxy cache, QueryResult result) {
                      return cache;
                    },
                    onCompleted: (dynamic resultData) {
                      // In case of an error the result data is empty and we short-circuit.
                      // Nevertheless, the error should be handled elsewhere, in the onError handler.
                      if (resultData == null) {
                        return;
                      }
                      final jwtToken = resultData['login'];
                      Provider.of<AuthenticationState>(context, listen: false)
                          .handleLogin(jwtToken);
                    },
                  ),
                  builder: (
                    RunMutation runMutation,
                    QueryResult result,
                  ) {
                    return RaisedButton(
                      onPressed: () async => runMutation({
                        'username': usernameController.value.text,
                        'password': passwordController.value.text,
                      }),
                      child: Text('Login'),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
