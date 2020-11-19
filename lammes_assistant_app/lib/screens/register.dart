import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:lammes_assistant_app/state/authentication_state.dart';
import 'package:provider/provider.dart';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();
  final lastNameFocusNode = FocusNode();
  final usernameFocusNode = FocusNode();
  final passwordFocusNode = FocusNode();
  final String registerMutation = """
    mutation Register(\$firstName: String!, \$lastName: String!, \$username: String!, \$password: String!) {
      register(
        firstName: \$firstName
        lastName: \$lastName
        username: \$username
        password: \$password
      ) {
        jwtToken
      }
    }
  """;

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
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
                Text(
                  'Registration',
                  style: Theme.of(context).textTheme.headline6,
                ),
                TextField(
                  decoration: InputDecoration(hintText: 'First Name'),
                  autofocus: true,
                  controller: firstNameController,
                  textInputAction: TextInputAction.next,
                  onEditingComplete: () => lastNameFocusNode.requestFocus(),
                ),
                TextField(
                  decoration: InputDecoration(hintText: 'Last Name'),
                  focusNode: lastNameFocusNode,
                  controller: lastNameController,
                  textInputAction: TextInputAction.next,
                  onEditingComplete: () => usernameFocusNode.requestFocus(),
                ),
                TextField(
                  decoration: InputDecoration(hintText: 'Username'),
                  focusNode: usernameFocusNode,
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
                    document: gql(registerMutation),
                    update: (GraphQLDataProxy cache, QueryResult result) {
                      return cache;
                    },
                    onCompleted: (dynamic resultData) {
                      // In case of an error the result data is empty and we short-circuit.
                      // Nevertheless, the error should be handled elsewhere, in the onError handler.
                      if (resultData == null) {
                        return;
                      }
                      final jwtToken = resultData['register']['jwtToken'];
                      Provider.of<AuthenticationState>(context, listen: false)
                          .storeJwtToken(jwtToken);
                      Navigator.of(context).pushReplacementNamed('/notes');
                    },
                  ),
                  builder: (
                      RunMutation runMutation,
                      QueryResult result,
                      ) {
                    return RaisedButton(
                      onPressed: () async => runMutation({
                        'firstName': firstNameController.value.text,
                        'lastName': lastNameController.value.text,
                        'username': usernameController.value.text,
                        'password': passwordController.value.text,
                      }),
                      child: Text('Register'),
                    );
                  },
                ),
                Text('Already having an account?'),
                FlatButton(
                  child: Text('Login'),
                  onPressed: () {
                    Navigator.of(context).pushReplacementNamed('/');
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
