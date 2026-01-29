import Joi from "joi";

export const uploadValidation = Joi.object().keys({
  name: Joi.string().trim().required().messages({
    "string.empty": "Please enter your name.",
    "any.required": "Please enter your name.",
  }),
  phone: Joi.string().trim().required().messages({
    "string.empty": "Please enter your phone number.",
    "any.required": "Please enter your phone number.",
  }),
  message: Joi.string().trim().optional().allow(""),
});
