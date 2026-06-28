import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return { data: { status: "ok" } };
  }

  @Get("ready")
  ready() {
    return { data: { status: "ready" } };
  }
}
