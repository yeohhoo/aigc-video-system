import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigService } from '@nestjs/config';
import { VolcengineImageService } from './volcengine-image.service';

const input = {
  prompt: 'ecommerce product image',
  aspectRatio: '9:16' as const,
};

function createService() {
  return new VolcengineImageService(new ConfigService());
}

describe('VolcengineImageService response parsing', () => {
  it('parses standard images API url response', () => {
    const result = createService().parseResponseForTest(
      {
        data: [{ url: 'https://example.com/image.png' }],
      },
      'images',
      input,
    );

    assert.equal(result.provider, 'volcengine');
    assert.equal(result.imageUrl, 'https://example.com/image.png');
  });

  it('parses standard images API b64_json response', () => {
    const result = createService().parseResponseForTest(
      {
        data: [{ b64_json: 'a'.repeat(128) }],
      },
      'images',
      input,
    );

    assert.equal(result.provider, 'volcengine');
    assert.equal(result.imageUrl, `data:image/png;base64,${'a'.repeat(128)}`);
  });

  it('parses Doubao Seed chat response with markdown image content', () => {
    const result = createService().parseResponseForTest(
      {
        choices: [
          {
            message: {
              content: '![generated image](https://example.com/doubao-seed.webp)',
            },
          },
        ],
      },
      'chat',
      input,
    );

    assert.equal(result.provider, 'volcengine');
    assert.equal(result.imageUrl, 'https://example.com/doubao-seed.webp');
  });

  it('parses Doubao Seed chat response with output_text JSON', () => {
    const result = createService().parseResponseForTest(
      {
        output_text: '{"imageUrl":"https://example.com/output-text.png"}',
      },
      'chat',
      input,
    );

    assert.equal(result.provider, 'volcengine');
    assert.equal(result.imageUrl, 'https://example.com/output-text.png');
  });

  it('parses Doubao Seed chat response with tool call arguments', () => {
    const result = createService().parseResponseForTest(
      {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: '{"url":"https://example.com/tool-call.jpg"}',
                  },
                },
              ],
            },
          },
        ],
      },
      'chat',
      input,
    );

    assert.equal(result.provider, 'volcengine');
    assert.equal(result.imageUrl, 'https://example.com/tool-call.jpg');
  });
});
