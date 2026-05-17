# SmartDoc

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
## Docker image
A production Docker image is available for the Angular frontend.
It builds the app with Node and serves it with Nginx.
### Build
```powershell
cd C:\Users\seifa\Desktop\SmartDoc
docker build -t smartdoc-frontend:local .
```
### Run
The container expects the SmartDoc backend to be reachable as `smartdoc:8087` on the same Docker network.
If you want to run it with the backend stack, attach it to the same network as your backend compose project.
```powershell
docker run --rm -p 8080:80 --name smartdoc-frontend --network smartdoc_default smartdoc-frontend:local
```
### Check
- Frontend: `http://localhost:8080`
- API proxy: `http://localhost:8080/api/v1/...`
