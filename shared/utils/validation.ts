import Joi from "joi";

export const uploadValidation = Joi.object().keys({
  message: Joi.string().trim().allow("").optional(),
  name: Joi.string().trim().when("message", {
    is: Joi.string().min(1).required(),
    then: Joi.required().messages({
      "string.empty": "Please enter your name.",
      "any.required": "Please enter your name.",
    }),
    otherwise: Joi.optional().allow(""),
  }),
  phone: Joi.string().trim().when("message", {
    is: Joi.string().min(1).required(),
    then: Joi.required().messages({
      "string.empty": "Please enter your phone number.",
      "any.required": "Please enter your phone number.",
    }),
    otherwise: Joi.optional().allow(""),
  }),
});
