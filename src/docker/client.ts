import http from "node:http";

// Acceso al Docker socket exclusivamente de lectura: este cliente solo hace GET.
export class DockerClient {
  constructor(private readonly socketPath: string) {}

  get(path: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        { socketPath: this.socketPath, path, method: "GET", headers: { Host: "docker" } },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk: string) => {
            body += chunk;
          });
          res.on("end", () => {
            if (res.statusCode === undefined || res.statusCode >= 400) {
              reject(new Error(`Docker API ${path} respondió ${res.statusCode ?? "sin código"}`));
              return;
            }
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error(`Docker API ${path} devolvió un cuerpo no-JSON`));
            }
          });
        },
      );
      req.on("error", reject);
      req.end();
    });
  }
}
