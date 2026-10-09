// app/lib/llm/models.ts
import type { Device } from './types'

export type VariantKey = 'webgpu-f16' | 'webgpu' | 'wasm'

export interface ModelVariant {
    dtype: string
    /** Files fetched for this variant, relative to the repo root (prefetched into the cache). */
    files: string[]
    downloadBytes: number
    /** Override the repo config: false for single-file exports with weights inside the .onnx. */
    externalData?: boolean
}

export interface Sampling {
    temperature: number
    topK: number
    topP: number
    repetitionPenalty: number
}

export interface ModelSpec {
    /** Short key used in ?model= and saved settings. */
    key: string
    /** False until it has passed the 30-question run on a real device; shown as untested. */
    verified?: boolean
    id: string
    /** Short name shown in the UI. */
    label: string
    /** Pinned commit so upstream changes can't silently alter what users download. */
    revision: string
    /** Where this model is the right choice — used by the model picker. */
    recommendedFor: 'phones' | 'laptops'
    /** Missing key = this model can't run on that kind of device. */
    variants: Partial<Record<VariantKey, ModelVariant>>
    sampling: Sampling
}

const TOKENIZER_FILES = ['tokenizer.json', 'tokenizer_config.json', 'config.json', 'generation_config.json']
const TOKENIZER_BYTES = 2_200_000

/**
 * SmolLM2 instruct (Hugging Face, Apache 2.0), English. Proven on a real iPhone over weeks of
 * prototype testing; Gemma was dropped after it crashed phone browsers. Files are used exactly as
 * published — never convert or re-quantize them.
 * - CPU (iPhone, phones without WebGPU): the int8 export uses MatMulInteger, which has fast WASM
 *   kernels, and plain Gather embeddings.
 * - 49k-token vocabulary (Gemma: 262k) keeps per-position logits small, which is what crashed Gemma.
 */
function smollm2(
    key: string,
    label: string,
    id: string,
    revision: string,
    recommendedFor: ModelSpec['recommendedFor'],
    bytes: { int8: number, q4: number, q4f16: number },
    verified = false,
): ModelSpec {
    return {
        key,
        verified,
        id,
        label,
        revision,
        recommendedFor,
        variants: {
            'webgpu-f16': { dtype: 'q4f16', files: [...TOKENIZER_FILES, 'onnx/model_q4f16.onnx'], downloadBytes: bytes.q4f16 + TOKENIZER_BYTES, externalData: false },
            'webgpu': { dtype: 'q4', files: [...TOKENIZER_FILES, 'onnx/model_q4.onnx'], downloadBytes: bytes.q4 + TOKENIZER_BYTES, externalData: false },
            'wasm': { dtype: 'int8', files: [...TOKENIZER_FILES, 'onnx/model_int8.onnx'], downloadBytes: bytes.int8 + TOKENIZER_BYTES, externalData: false },
        },
        // SmolLM2's recommended settings: low temperature keeps small models on track.
        sampling: { temperature: 0.2, topK: 50, topP: 0.9, repetitionPenalty: 1.1 },
    }
}

export const SMOLLM2_360M = smollm2(
    'smollm2-360m', 'SmolLM2 360M', 'HuggingFaceTB/SmolLM2-360M-Instruct',
    'a10cc1512eabd3dde888204e902eca88bddb4951', 'phones',
    { int8: 364_564_558, q4: 387_943_246, q4f16: 272_737_275 },
    true, // 30/30 on a real phone
)

/** For laptops with a graphics chip. Passed its 30-question run on a laptop with no crashes. */
export const SMOLLM2_1_7B = smollm2(
    'smollm2-1.7b', 'SmolLM2 1.7B', 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
    '31b70e2e869a7173562077fd711b654946d38674', 'laptops',
    { int8: 1_714_119_778, q4: 1_411_969_607, q4f16: 1_108_730_338 },
    true,
)

/** Models the picker offers. */
export const MODELS = [SMOLLM2_360M, SMOLLM2_1_7B]
export const DEFAULT_MODEL = SMOLLM2_360M

export function variantKey(device: Device, shaderF16: boolean): VariantKey {
    if (device === 'wasm') return 'wasm'
    return shaderF16 ? 'webgpu-f16' : 'webgpu'
}

/** Same URL transformers.js uses as its Cache Storage key. */
export function fileUrl(spec: Pick<ModelSpec, 'id' | 'revision'>, file: string) {
    return `https://huggingface.co/${spec.id}/resolve/${spec.revision}/${file}`
}
