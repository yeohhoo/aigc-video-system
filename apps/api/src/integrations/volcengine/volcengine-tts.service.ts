import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { GenerateSpeechInput, GenerateSpeechOutput } from '../provider.types';
import {
  VolcengineTtsRequest,
  VolcengineTtsResponse,
  VolcengineTtsResult,
} from './volcengine.types';

@Injectable()
export class VolcengineTtsService {
  private readonly defaultEndpoint = 'https://openspeech.bytedance.com/api/v1/tts';
  private readonly defaultVoiceType = 'zh_female_wanqudashu_moon_bigtts';

  constructor(private readonly configService: ConfigService) {}

  async generateSpeech(input: GenerateSpeechInput): Promise<GenerateSpeechOutput> {
    const endpoint = this.getConfigValue('VOLCENGINE_ENDPOINT') || this.defaultEndpoint;
    const appId = this.getConfigValue('VOLCENGINE_APP_ID');
    const accessToken =
      this.getConfigValue('VOLCENGINE_ACCESS_TOKEN') || this.getConfigValue('VOLCENGINE_API_KEY');

    if (!appId) throw new BadRequestException('VOLCENGINE_APP_ID is required for Volcengine TTS');
    if (!accessToken) {
      throw new BadRequestException('VOLCENGINE_ACCESS_TOKEN is required for Volcengine TTS');
    }

    const request = this.buildRequest(input, appId, accessToken);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer;${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const payload = (await response.json().catch(() => null)) as VolcengineTtsResponse | null;
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Volcengine TTS request failed with HTTP ${response.status}`,
      );
    }

    return this.parseResponse(payload);
  }

  private buildRequest(
    input: GenerateSpeechInput,
    appId: string,
    accessToken: string,
  ): VolcengineTtsRequest {
    return {
      app: {
        appid: appId,
        token: accessToken,
        cluster: 'volcano_tts',
      },
      user: {
        uid: 'aigc-video-dev',
      },
      audio: {
        voice_type: this.resolveVoiceType(input.voiceStyle),
        encoding: 'mp3',
        speed_ratio: 1.0,
        rate: 24000,
        language: input.language === 'zh' ? 'cn' : 'en',
      },
      request: {
        reqid: randomUUID(),
        text: input.text,
        text_type: 'plain',
        operation: 'query',
      },
    };
  }

  private parseResponse(payload: VolcengineTtsResponse | null): VolcengineTtsResult {
    if (!payload) throw new InternalServerErrorException('Volcengine TTS returned empty response');

    const code = payload.code ?? payload.status_code;
    const success = code === undefined || code === 0 || code === 3000;
    if (!success) {
      throw new InternalServerErrorException(
        payload.message || `Volcengine TTS failed with code ${code}`,
      );
    }

    const audioUrl = this.findAudioUrl(payload);
    if (audioUrl) return { audioUrl };

    const audioBase64 = this.findAudioBase64(payload);
    if (!audioBase64) {
      throw new InternalServerErrorException('Volcengine TTS response did not include audio data');
    }

    return {
      audioUrl: `data:audio/mp3;base64,${audioBase64}`,
    };
  }

  private findAudioUrl(payload: VolcengineTtsResponse): string | undefined {
    return payload.url ?? payload.audioUrl ?? payload.result?.url ?? payload.result?.audio_url;
  }

  private findAudioBase64(payload: VolcengineTtsResponse): string | undefined {
    return payload.data ?? payload.audio ?? payload.result?.audio ?? payload.result?.audio_base64;
  }

  private resolveVoiceType(voiceStyle?: string): string {
    if (!voiceStyle) return this.defaultVoiceType;

    const knownStyles: Record<string, string> = {
      natural: this.defaultVoiceType,
      自然口播: this.defaultVoiceType,
      energetic: 'zh_female_cancan_mars_bigtts',
      活泼: 'zh_female_cancan_mars_bigtts',
      premium: 'zh_male_M392_conversation_wvae_bigtts',
      高级: 'zh_male_M392_conversation_wvae_bigtts',
    };

    return knownStyles[voiceStyle] ?? voiceStyle;
  }

  private getConfigValue(key: string): string | undefined {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) return undefined;
    return value.replace(/^['"]|['"]$/g, '');
  }
}
