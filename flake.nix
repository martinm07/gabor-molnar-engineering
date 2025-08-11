#### TO START THE DEV SHELL ENVIRONMENT DEFINED HERE, RUN 'nix develop'.
{
  description = "gabor-molnar-engineering development tools";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: {
    devShells.x86_64-linux.default = let
      pkgs = import nixpkgs {system = "x86_64-linux";};
    in
      pkgs.mkShell {
        buildInputs = with pkgs; [
          # common build inputs
          direnv
          xclip
          duf
          eza
          fd

          nodejs

          python313
          uv

          # Without including these packages, running kamal generates the warnings
          #  "Ignoring debug-x.x.x/racc-x.x.x/rbs-x.x.x because its extensions are not built"
          #  racc, rbs and debug are default/native extensions, that need to be built using C locally.
          #  To build them we need to include them explicitly it seems. Unfortunately, nixpkgs doesn't
          #  provide "debug" as a package. LUCKILY just by including the other two, warnings for debug
          #  also happen to go away.
          (ruby.withPackages
            (ps: with ps; [racc rbs]))
          bundler

          docker
          (pkgs.writeShellScriptBin "typesense-start" ''
            #!/usr/bin/env bash

            # NOTE: We require aquiring the project root folder on shell initialization,
            #        and not on the running of this script, as the location of the file
            #        produced by pkgs.writeShellScriptBin is not in the projct root folder,
            #        but in the Nix store! (we get the project root by getting the location of flake.nix)
            cd "$PROJECT_HOME"

            source .env

            echo "Starting typesense container..."
            echo "Using API key: '$FLASK_TYPESENSE_API_KEY'"
            echo ""

            docker run -p 8108:8108 -v$(pwd)/instance/typesense-data:/data typesense/typesense:29.0 \
              --data-dir /data --api-key=$FLASK_TYPESENSE_API_KEY --enable-cors
          '')
        ];

        env = {
          # IMP: That the Ruby version matches up with the ruby version installed by this shell.nix buildInputs
          PATH = "$PATH:/home/martinm/.local/share/gem/ruby/3.3.0/bin";
        };

        shellHook = ''
          echo "Dev shell ready."
          echo "Run 'typesense-start' to start Typesense server through Docker"
          echo "|  ASSUMES DOCKER DAEMON IS ACTIVE - 'virtualisation.docker.enable = true;' in NixOS system configuration."
          echo "Run 'cd svelte && npm run dev' to start Svelte development server."
          echo "Run 'flask run --debug' to start Flask development server."
          echo "|  If no virtual environment is present, then run 'uv init'."
          echo "ASSUMES MySQL SERVER IS ALREADY ACTIVE"
          echo "|  'services.mysql.enable = true;' and 'services.mysql.package = pkgs.mysql84;' in NixOS system configuration."
          echo "|  The 'FLASK_SQLALCHEMY_DATABASE_URI' env var also requires a user to be able to log in as, using a password."
          echo "|  To configure the root user to have a password first run 'sudo mysql' to access the MySQL console and then run"
          echo "|  ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '[NEW_PASSWORD_HERE]'"
          echo "|  to set the authentication method to password and set the password itself."
          echo "|  (after this, accessing the MySQL console as root is done using 'mysql --user=root --password'"
          echo "Run 'kamal deploy' to deploy website to production"
          echo ""

          # `dirname "$0"` gives the directory of this file (flake.nix): https://stackoverflow.com/a/3355423
          export PROJECT_HOME="$(realpath "$(dirname "$0")")"
          # echo "$PROJECT_HOME"

          if [ -f "''${PROJECT_HOME}/.venv/bin/activate" ]; then
            source "''${PROJECT_HOME}/.venv/bin/activate"
          else
            echo "No virtual environment detected (checked existence of './.venv/bin/activate'). Recommended you run 'uv init' to create it."
          fi

          # Clear the hash table so that the PATH updates (by activating the virtual environment) are reflected immediately
          hash -r

          #alias ls=eza
          #alias ls="ls -alh --color=auto"
          alias ls="eza --long --group --header -a --classify --links --level=3 --color=auto --sort=type --time-style=long-iso --extended"
          alias find=fd
          alias fd="fd --hidden --list-details --color=auto" # cannot be aliased to 'find' if using hlissner doom emacs
          #alias fd="fd --hidden --no-ignore --follow --list-details --color=auto" # cannot be aliased to 'find' if using hlissner doom emacs
          #alias fd="find -L" # cannot be aliased if using hlissner doom emacs
          alias du="duf"

          #git
          alias gst="git status"
          alias gc="git commit"
          alias gcm="git commit -m"
          alias ga="git add"
          alias gaa="git add --all"
          alias gcl="git clone -v --progress"
          alias gb="git branch"
          alias gp="git push -u"
          alias gpu="git push -u"

          #import parent shell config
          [ -x ~/.bashrc ] && source ~/.bashrc
          [ -x ~/.zshrc ] && source ~/.zshrc
        '';
      };
  };
}
