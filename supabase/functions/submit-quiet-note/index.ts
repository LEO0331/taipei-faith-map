import { createQuietHandler } from '../_shared/quietHandler.ts';

Deno.serve(createQuietHandler('submit', { env: name => Deno.env.get(name) }));
