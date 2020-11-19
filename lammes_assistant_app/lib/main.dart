import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:lammes_assistant_app/screens/login.dart';
import 'package:lammes_assistant_app/screens/notes.dart';
import 'package:lammes_assistant_app/screens/register.dart';
import 'package:lammes_assistant_app/state/authentication_state.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthenticationState(),
      child: Consumer<AuthenticationState>(
        builder: (context, authenticationState, child) {
          final HttpLink httpLink = HttpLink(
            'http://10.0.2.2:4000/',
          );
          final AuthLink authLink = AuthLink(
            getToken: () async {
              var jwtToken = authenticationState.getJwtToken();
              return jwtToken.isNotEmpty ? 'Bearer ' + jwtToken : '';
            },
          );
          final Link link = authLink.concat(httpLink);
          ValueNotifier<GraphQLClient> client = ValueNotifier(
            GraphQLClient(
              link: link,
              cache: GraphQLCache(),
            ),
          );
          return GraphQLProvider(
            client: client,
            child: child,
          );
        },
        child: MaterialApp(
          title: 'Flutter Demo',
          routes: {
            '/': (context) => LoginScreen(),
            '/register': (context) => RegisterScreen(),
            '/notes': (context) => NotesScreen()
          },
          theme: ThemeData(
            // This is the theme of your application.
            //
            // Try running your application with "flutter run". You'll see the
            // application has a blue toolbar. Then, without quitting the app, try
            // changing the primarySwatch below to Colors.green and then invoke
            // "hot reload" (press "r" in the console where you ran "flutter run",
            // or simply save your changes to "hot reload" in a Flutter IDE).
            // Notice that the counter didn't reset back to zero; the application
            // is not restarted.
            primarySwatch: Colors.blue,
            // This makes the visual density adapt to the platform that you run
            // the app on. For desktop platforms, the controls will be smaller and
            // closer together (more dense) than on mobile platforms.
            visualDensity: VisualDensity.adaptivePlatformDensity,
          ),
        ),
      ),
    );
  }
}