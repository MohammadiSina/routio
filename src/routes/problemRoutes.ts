import express from 'express';

import * as ctrls from '../controllers/problemControllers';

const router = express.Router();

router
  .route('/:id')
  .get(ctrls.readProblem)
  .patch(ctrls.updateProblem)
  .delete(ctrls.deleteProblem);

router.route('/').post(ctrls.createProblem).get(ctrls.readAllProblem);

export { router as problemRouter };
