import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import UpdateService from "./services/update";
import ProxyService from "./services/proxy";
import { sendError } from "./utils";
import { parse } from "express-useragent";

const app = express();
app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send(req.headers));

app.get("/refresh", async function (req, res) {
  UpdateService.getInstance()
    .refresh(req.headers.token as string)
    .then((result) => res.status(200).send(result))
    .catch((err) => sendError(res, err));
});

app.get("/download", async function (req, res) {
  UpdateService.getInstance()
    .download(parse(req.headers["user-agent"] || ""), !!req.query.update)
    .then((result) => res.redirect(result.location))
    .catch((err) => sendError(res, err));
});

app.get("/proxy/:version", async function (req, res) {
  ProxyService.getInstance()
    .proxy(req.query.url as string)
    .then((result) => res.redirect(result.location))
    .catch((err) => sendError(res, err));
});

app.get("/download/:platform", async function (req, res) {
  UpdateService.getInstance()
    .platformDownload(req.params.platform, !!req.query.update)
    .then((result) => res.redirect(result.location))
    .catch((err) => sendError(res, err));
});

app.get("/update/:platform/:version", async function (req, res) {
  UpdateService.getInstance()
    .update(req.params.platform, req.params.version)
    .then((result) => res.status(200).send(result))
    .catch((err) => sendError(res, err));
});

app.get("/update/:platform/:version/RELEASES", async function (_, res) {
  UpdateService.getInstance()
    .releases()
    .then((result) => {
      res.setHeader("content-length", Buffer.byteLength(result, "utf-8"));
      res.setHeader("content-type", "application/octet-stream");
      res.status(200);
      res.send(result);
    })
    .catch((err) => sendError(res, err));
});

export default app;
