import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:lammes_assistant_app/screens/create_note.dart';
import 'package:lammes_assistant_app/screens/login.dart';
import 'package:lammes_assistant_app/screens/notes.dart';
import 'package:lammes_assistant_app/screens/register.dart';
import 'package:lammes_assistant_app/screens/splash.dart';
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
          initialRoute: '/splash',
          routes: {
            '/splash': (context) => SplashScreen(),
            '/login': (context) => LoginScreen(),
            '/register': (context) => RegisterScreen(),
            '/notes': (context) => NotesScreen(),
            '/createNote': (context) => CreateNoteScreen()
          },
          theme: ThemeData(
            primarySwatch: Colors.blue,
            visualDensity: VisualDensity.adaptivePlatformDensity,
          ),
        ),
      ),
    );
  }
}