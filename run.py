import os
import subprocess
import sys

def main():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)

    print("Checking dependencies...")
    node_modules_path = os.path.join(project_dir, "node_modules")
    
    if not os.path.exists(node_modules_path):
        print("node_modules not found. Installing dependencies...")
        try:
            subprocess.run(["npm", "install"], check=True, shell=True)
            print("Dependencies installed successfully.")
        except subprocess.CalledProcessError:
            print("Error: Failed to install dependencies. Please ensure Node.js and npm are installed.", file=sys.stderr)
            sys.exit(1)
    
    print("Starting the Vite development server...")
    try:
        # Run the dev server
        subprocess.run(["npm", "run", "dev"], check=True, shell=True)
    except KeyboardInterrupt:
        print("\nDevelopment server stopped.")
    except subprocess.CalledProcessError:
        print("Error: Failed to start the development server.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
