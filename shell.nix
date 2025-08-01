{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.pkg-config
    pkgs.gtk3
    pkgs.libayatana-appindicator
  ];
}

