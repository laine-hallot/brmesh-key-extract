{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs }:
  let
    pkgs = nixpkgs.legacyPackages.x86_64-linux.pkgs;
    in {
    devShells.x86_64-linux.default = pkgs.mkShell {
      name = "My-project build environment";
      buildInputs = [ pkgs.nodejs_24 ];
      shellHook = ''
        echo "Node 24"
      '';
    };
  };
}
