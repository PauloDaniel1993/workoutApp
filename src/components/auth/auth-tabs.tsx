"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"

export function AuthTabs() {
  return (
    <Card className="w-full p-2 sm:p-4">
      <CardHeader className="gap-2 text-center sm:text-left">
        <CardTitle className="text-xl">Welcome</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="gap-4">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-2">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup" className="pt-2">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
