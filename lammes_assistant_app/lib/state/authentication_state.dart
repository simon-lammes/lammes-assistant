import 'package:flutter/cupertino.dart';

class AuthenticationState extends ChangeNotifier {
  String _jwtToken = '';

  String getJwtToken() {
    return _jwtToken;
  }

  void handleLogin(String jwtToken) {
    _jwtToken = jwtToken;
    notifyListeners();
  }
}