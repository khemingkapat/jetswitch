{
  description = "JetSwitch App dev shells (Node, Go, Python)";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    # uv2nix inputs for Python
    pyproject-nix = {
      url = "github:pyproject-nix/pyproject.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    uv2nix = {
      url = "github:pyproject-nix/uv2nix";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.pyproject-nix.follows = "pyproject-nix";
    };
    pyproject-build-systems = {
      url = "github:pyproject-nix/build-system-pkgs";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.pyproject-nix.follows = "pyproject-nix";
      inputs.uv2nix.follows = "uv2nix";
    };
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      uv2nix,
      pyproject-nix,
      pyproject-build-systems,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        python = pkgs.python313;

        # Load uv2nix workspace
        workspace = uv2nix.lib.workspace.loadWorkspace { workspaceRoot = ./ml_service; };

        overlay = workspace.mkPyprojectOverlay {
          sourcePreference = "wheel";
        };

        pythonSet =
          (pkgs.callPackage pyproject-nix.build.packages {
            inherit python;
          }).overrideScope
            (
              nixpkgs.lib.composeManyExtensions [
                pyproject-build-systems.overlays.default
                overlay
              ]
            );

        # Use environment variable for editable root instead of passing path directly
        editableOverlay = workspace.mkEditablePyprojectOverlay {
          root = "$REPO_ROOT/ml_service";
        };

        devPythonSet = pythonSet.overrideScope editableOverlay;
        virtualenv = devPythonSet.mkVirtualEnv "dev-env" workspace.deps.all;
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

          # Python shell using uv2nix
          python = pkgs.mkShell {
            name = "ml";
            packages = [
              virtualenv
              pkgs.uv
            ];
            shellHook = ''
              # Set REPO_ROOT first
              export REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

              # Clear PYTHONPATH to avoid conflicts
              unset PYTHONPATH

              # UV environment variables
              export UV_NO_SYNC=1
              export UV_PYTHON="${python.interpreter}"
              export UV_PYTHON_DOWNLOADS="never"

              echo "🐍 Python shell ready (uv2nix dev environment)"
              echo "   REPO_ROOT: $REPO_ROOT"
              echo "   Python: ${python.interpreter}"
            '';
          };
        };

        # Default shell
        devShell = self.devShells.${system}.python;
      }
    );
}
