import 'package:flutter/cupertino.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthenticationState extends ChangeNotifier {
  final _storage = new FlutterSecureStorage();
  final String _jwtTokenKey = "JWT_TOKEN";
  String _jwtToken = '';

  String getJwtToken() {
    return _jwtToken;
  }

  void storeJwtToken(String jwtToken) {
    _jwtToken = jwtToken;
    notifyListeners();
    // Because writing to storage is a potentially long-running operation,
    // we do not await it before notifying listeners. I'm not 100% sure whether
    // this is "best practice".
    _storage.write(key: _jwtTokenKey, value: jwtToken);
  }

  /// This application stores the users JWT token in a secure storage so that
  /// on subsequent app starts, the user does not need to login again.
  /// This method is responsible for loading the stored JWT token into memory.
  Future<void> loadJwtTokenFromSecureStorage() async {
    final loadedToken = await _storage.read(key: _jwtTokenKey);
    if (loadedToken == null || loadedToken == _jwtToken) {
      return;
    }
    _jwtToken = loadedToken;
    notifyListeners();
  }

  isAuthenticated() {
    return _jwtToken.isNotEmpty;
  }
}