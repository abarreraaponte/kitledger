CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"alt_id" varchar(64),
	"balance_type" varchar(10) NOT NULL,
	"ledger_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(64) NOT NULL,
	"meta" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "accounts_ref_id_unique" UNIQUE("ref_id"),
	CONSTRAINT "accounts_alt_id_unique" UNIQUE("alt_id")
);
--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"hash" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "entity_models" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"alt_id" varchar(64),
	"name" varchar(64) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "entity_models_ref_id_unique" UNIQUE("ref_id"),
	CONSTRAINT "entity_models_alt_id_unique" UNIQUE("alt_id")
);
--> statement-breakpoint
CREATE TABLE "ledgers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"alt_id" varchar(64),
	"name" varchar(64) NOT NULL,
	"description" varchar(255),
	"unit_model_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "ledgers_ref_id_unique" UNIQUE("ref_id"),
	CONSTRAINT "ledgers_alt_id_unique" UNIQUE("alt_id")
);
--> statement-breakpoint
CREATE TABLE "permission_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"permission_id" uuid NOT NULL,
	"user_id" uuid,
	"role_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"hash" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "system_permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"permission" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction_models" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"alt_id" varchar(64),
	"name" varchar(64) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "transaction_models_ref_id_unique" UNIQUE("ref_id"),
	CONSTRAINT "transaction_models_alt_id_unique" UNIQUE("alt_id")
);
--> statement-breakpoint
CREATE TABLE "unit_models" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ref_id" varchar(64) NOT NULL,
	"alt_id" varchar(64),
	"name" varchar(64) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"base_unit_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "unit_models_ref_id_unique" UNIQUE("ref_id"),
	CONSTRAINT "unit_models_alt_id_unique" UNIQUE("alt_id"),
	CONSTRAINT "unit_models_base_unit_id_unique" UNIQUE("base_unit_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(64) NOT NULL,
	"last_name" varchar(64) NOT NULL,
	"email" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_assignments" ADD CONSTRAINT "permission_assignments_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_permissions" ADD CONSTRAINT "system_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_token_user_idx" ON "api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "permission_assignment_user_idx" ON "permission_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "permission_assignment_role_idx" ON "permission_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "permission_assignment_permission_idx" ON "permission_assignments" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "system_permission_user_idx" ON "system_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "system_permission_permission_idx" ON "system_permissions" USING btree ("permission");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");