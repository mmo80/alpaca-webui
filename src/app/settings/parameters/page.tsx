'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
        <CardDescription>Feature not yet implemented.</CardDescription>
      </CardHeader>
      <CardContent></CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button disabled={true}>Save</Button>
      </CardFooter>
    </Card>
  );
}
