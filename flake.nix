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

        editableOverlay = workspace.mkEditablePyprojectOverlay { root = ./ml_service; };

        devPythonSet = pythonSet.overrideScope (nixpkgs.lib.composeManyExtensions [ editableOverlay ]);

        virtualenv = devPythonSet.mkVirtualEnv "dev-env" workspace.deps.all;
      in
      {
        devShells = {
          # Frontend shell
          frontend = pkgs.mkShell {
            name = "moviestreaming-dev-shell";
            buildInputs = [
              nodejs
              pkgs.eslint
              pkgs.nodePackages.typescript
              pkgs.nodePackages.typescript-language-server
            ];

            shellHook = ''
              if [ ! -d node_modules ]; then
                echo "Installing npm dependencies..."
                npm install
              fi
              echo "✅ Backend shell ready (Go)"
            '';
          };
          # Backend shell
          backend = pkgs.mkShell {
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
            packages = [
              virtualenv
              pkgs.uv
            ];

            env = {
              UV_NO_SYNC = "1";
              UV_PYTHON = python.interpreter;
              UV_PYTHON_DOWNLOADS = "never";
            };

            shellHook = ''
              unset PYTHONPATH
              export REPO_ROOT=$(git rev-parse --show-toplevel)
              echo "🐍 Python shell ready (uv2nix dev environment)"
            '';
          };
        };
      }
    );
}
