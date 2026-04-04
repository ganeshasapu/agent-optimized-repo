"use client";

import { useActionState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@biarritz/ui";

import { createUserAction } from "../actions/user.actions";

type FormState =
  | { success: true; data: { id: string; name: string | null; email: string } }
  | { success: false; error: Record<string, string[] | undefined> }
  | null;

async function formAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return createUserAction(formData);
}

export function CreateUserForm() {
  const [state, action, isPending] = useActionState<FormState, FormData>(
    formAction,
    null,
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Create User</CardTitle>
      </CardHeader>
      <CardContent>
        {state?.success === true && (
          <p className="mb-4 text-sm text-green-600">
            User &quot;{state.data.email}&quot; created successfully.
          </p>
        )}
        <form action={action} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Jane Doe" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              required
            />
            {state?.success === false && state.error.email && (
              <p className="text-sm text-red-600">{state.error.email[0]}</p>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
