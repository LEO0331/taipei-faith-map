import { createQuietHandler } from '../_shared/quietHandler.ts';

Deno.serve(createQuietHandler('report', { env: name => Deno.env.get(name) }));
