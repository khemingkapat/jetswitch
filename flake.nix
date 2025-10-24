{
  description = "JetSwitch App dev shells (Node, Go, Python)";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells = {
          # Frontend shell
          frontend = pkgs.mkShell {
            name = "frontend";
            buildInputs = [
              pkgs.nodejs
              pkgs.eslint
              pkgs.nodePackages.typescript
              pkgs.nodePackages.typescript-language-server
            ];
            shellHook = ''
              if [ ! -d node_modules ]; then
                echo "Installing npm dependencies..."
                npm install
              fi
              echo "✅ Frontend shell ready (Node)"
            '';
          };

          # Backend shell
          backend = pkgs.mkShell {
            name = "backend";
            packages = with pkgs; [
              go
              gopls
              gofumpt
            ];
            shellHook = ''
              echo "✅ Backend shell ready (Go)"
            '';
          };

          # Python shell - simplified without uv2nix
          python = pkgs.mkShell {
            name = "ml";
            packages = with pkgs; [
              python313
              uv
              # Build tools
              gcc
              stdenv.cc.cc.lib # This provides libstdc++
              # Audio/ML system dependencies
              ffmpeg
              libsndfile
              tbb
              portaudio
            ];

            shellHook = ''
              export REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

              # Add system libraries to LD_LIBRARY_PATH
              export LD_LIBRARY_PATH="${
                pkgs.lib.makeLibraryPath [
                  pkgs.stdenv.cc.cc.lib # libstdc++, libgcc_s
                  pkgs.tbb
                  pkgs.libsndfile
                  pkgs.ffmpeg
                  pkgs.portaudio
                  pkgs.zlib # often needed by NumPy
                ]
              }''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

              # Set up UV to use the Nix Python
              export UV_PYTHON="${pkgs.python313}/bin/python"

              # Auto-activate venv if it exists
              if [ -f "$REPO_ROOT/ml_service/.venv/bin/activate" ]; then
                source "$REPO_ROOT/ml_service/.venv/bin/activate"
                echo "🐍 Python venv activated"
              fi

              echo "🐍 Python shell ready"
              echo "   Python: $(python --version)"
              echo "   UV: $(uv --version)"
            '';
          };
        };

        # Default shell
        devShell = self.devShells.${system}.python;
      }
    );
}
