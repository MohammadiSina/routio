import express from 'express';

import * as ctrls from '../controllers/foreControllers';

const router = express.Router();

router.route('/').post(ctrls.solveProblem);

export { router as foreRouter };
