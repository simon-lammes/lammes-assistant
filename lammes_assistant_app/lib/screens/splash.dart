import 'package:flutter/material.dart';
import 'package:lammes_assistant_app/state/authentication_state.dart';
import 'package:provider/provider.dart';

/// This screen should **only** be displayed when the app starts and does asynchronous initialization.
/// This screen lets the authentication state initialize and afterwards navigates the
/// user to the next page depending on whether he is authenticated or not.
class SplashScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthenticationState>(
      builder: (context, authenticationState, child) {
        return FutureBuilder(
          future: () async {
            await authenticationState.loadJwtTokenFromSecureStorage();
            Navigator.pushReplacementNamed(context, authenticationState.isAuthenticated() ? '/notes' : '/login');
          }(),
          builder: (context, snapshot) {
            return Scaffold(
            );
          },
        );
      },
    );
  }
}
