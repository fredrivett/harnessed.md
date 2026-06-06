import { describe, it, expect } from 'vitest';
import { slugFromId } from './slug';

describe('slugFromId', () => {
	it('strips a leading numeric sort prefix', () => {
		expect(slugFromId('01-openai')).toBe('openai');
		expect(slugFromId('123-acme-corp')).toBe('acme-corp');
	});

	it('leaves ids without a prefix unchanged', () => {
		expect(slugFromId('openai')).toBe('openai');
	});

	it('only strips the leading prefix, not digits elsewhere in the id', () => {
		expect(slugFromId('01-web3-co')).toBe('web3-co');
	});
});
