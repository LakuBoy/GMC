import { schemas } from '../../../lib/community';
import { parse, route } from '../../../lib/server/api';
import { summariesFor } from '../../../lib/server/community';

// GET /api/community/summaries?ids=node/1,way/2 : what the list cards show.
export default route({
  GET: async ({ req }) => ({ summaries: await summariesFor(parse(schemas.idList, req.query).ids) }),
});
