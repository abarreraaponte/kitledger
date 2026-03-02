import { type BaseIssue, type IssuePathItem } from "valibot";

export type ValidationError = {
	type: "structure" | "data";
	path: string | null;
	message: string;
};

export function parseValibotIssues<T>(issues: BaseIssue<T>[]): ValidationError[] {
	return issues.map((issue) => ({
		type: "structure",
		path: issue.path ? issue.path.map((p: IssuePathItem) => p.key).join(".") : "",
		message: issue.message,
	}));
}

export type ValidationSuccess<T> = {
	success: true;
	data: T;
};

export type ValidationResult<T> = {
	success: boolean;
	data?: T;
	errors?: ValidationError[];
};

export type ValidationFailure<T> = {
	success: false;
	data?: T;
	errors?: ValidationError[];
};

export function isValidationFailure<T extends object, U>(
	result: T | ValidationResult<U>,
): result is ValidationResult<U> {
	return "errors" in result;
}
