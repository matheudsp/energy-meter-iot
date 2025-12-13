import {
  Injectable,
  OnModuleInit,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InfluxDB,
  Point,
  WriteApi,
  QueryApi,
} from '@influxdata/influxdb-client';
import type { InfluxChannelData } from '@/common/interfaces/telemetry.types';

@Injectable()
export class InfluxService implements OnModuleInit, OnApplicationShutdown {
  private influxDB: InfluxDB;
  private writeApi: WriteApi;
  private queryApi: QueryApi;
  private readonly logger = new Logger(InfluxService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('INFLUX_URL');
    const token = this.configService.get<string>('INFLUX_TOKEN');
    const org = this.configService.get<string>('INFLUX_ORG');
    const bucket = this.configService.get<string>('INFLUX_BUCKET');

    if (!url || !token || !org || !bucket) {
      throw new Error('Configurações do InfluxDB em falta no .env');
    }

    this.influxDB = new InfluxDB({ url, token });

    this.writeApi = this.influxDB.getWriteApi(org, bucket, 'ns', {
      batchSize: 10,
      flushInterval: 1000,
    });

    this.queryApi = this.influxDB.getQueryApi(org);

    this.logger.log(`Conectado ao InfluxDB em: ${url}`);
  }

  async writeMeasurement(
    deviceId: string,
    channelId: string,
    data: {
      voltage: number;
      current: number;
      power: number;
      total_kwh: number;
    },
  ) {
    try {
      const point = new Point('circuit_telemetry')
        .tag('device_id', deviceId)
        .tag('channel_id', channelId)
        .floatField('voltage', data.voltage)
        .floatField('current', data.current)
        .floatField('power', data.power)
        .floatField('total_kwh', data.total_kwh);

      this.writeApi.writePoint(point);
    } catch (error) {
      this.logger.error(`Erro ao gravar no InfluxDB: ${error.message}`);
    }
  }

  async getConsumptionDifference(
    deviceId: string,
    channelId: string,
    start: Date,
  ): Promise<number> {
    const bucket = this.configService.get<string>('INFLUX_BUCKET');

    // spread() retorna a diferença entre max e min no período
    const query = `
      from(bucket: "${bucket}")
        |> range(start: ${start.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "circuit_telemetry")
        |> filter(fn: (r) => r["device_id"] == "${deviceId}")
        |> filter(fn: (r) => r["channel_id"] == "${channelId}")
        |> filter(fn: (r) => r["_field"] == "total_kwh")
        |> spread()
        |> yield(name: "result")
    `;

    try {
      const rows = await this.queryApi.collectRows(query);
      if (rows.length > 0) {
        const row = rows[0] as { _value: number };
        return row._value || 0;
      }
      return 0;
    } catch (error) {
      this.logger.error(
        `Erro no cálculo de consumo: ${(error as Error).message}`,
      );
      return 0;
    }
  }
  async getMetricByPeriod(
    deviceId: string,
    channelId: string,
    field: string,
    start: string,
    windowPeriod: string,
    aggFn: string,
    isCumulative: boolean,
  ) {
    const bucket = this.configService.get<string>('INFLUX_BUCKET');

    let query = `
    from(bucket: "${bucket}")
      |> range(start: ${start})
      |> filter(fn: (r) => r["_measurement"] == "circuit_telemetry")
      |> filter(fn: (r) => r["device_id"] == "${deviceId}")
      |> filter(fn: (r) => r["channel_id"] == "${channelId}")
      |> filter(fn: (r) => r["_field"] == "${field}")
      |> aggregateWindow(every: ${windowPeriod}, fn: ${aggFn}, createEmpty: false)
    `;

    if (isCumulative) {
      query += ` |> difference()`;
    }

    query += ` |> yield(name: "result")`;

    return this.queryApi.collectRows(query);
  }

  async getLastState(
    deviceId: string,
    channelId: string,
  ): Promise<InfluxChannelData | null> {
    const bucket = this.configService.get<string>('INFLUX_BUCKET');

    const query = `
      from(bucket: "${bucket}")
        |> range(start: -24h) 
        |> filter(fn: (r) => r["_measurement"] == "circuit_telemetry")
        |> filter(fn: (r) => r["device_id"] == "${deviceId}")
        |> filter(fn: (r) => r["channel_id"] == "${channelId}")
        |> last()
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    // Tipagem estrita aqui
    const rows = await this.queryApi.collectRows(query);
    return rows.length > 0 ? (rows[0] as unknown as InfluxChannelData) : null;
  }

  onApplicationShutdown() {
    this.writeApi.close().then(() => {
      this.logger.log('Conexão InfluxDB fechada com sucesso.');
    });
  }
}
