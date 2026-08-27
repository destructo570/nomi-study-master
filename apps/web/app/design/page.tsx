import type { Metadata } from "next"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { Progress } from "@workspace/ui/components/progress"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Toggle } from "@workspace/ui/components/toggle"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Toaster } from "@workspace/ui/components/sonner"

function ColorSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-1">
      <div className={`h-16 w-full rounded-lg ${className}`} />
      <p className="text-xs text-muted-foreground">{name}</p>
    </div>
  )
}

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false, nocache: true },
}

export default function DesignPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <Toaster />
        <div className="mx-auto max-w-6xl space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
            <p className="text-lg text-muted-foreground">
              A comprehensive showcase of all UI components. Use this page to
              test and tweak your design.
            </p>
          </div>

          {/* Color Palette */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Color Palette</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
              <ColorSwatch name="Background" className="border bg-background" />
              <ColorSwatch name="Foreground" className="bg-foreground" />
              <ColorSwatch name="Card" className="border bg-card" />
              <ColorSwatch
                name="Card Foreground"
                className="bg-card-foreground"
              />
              <ColorSwatch name="Popover" className="border bg-popover" />
              <ColorSwatch
                name="Popover Foreground"
                className="bg-popover-foreground"
              />
              <ColorSwatch name="Primary" className="bg-primary" />
              <ColorSwatch
                name="Primary Foreground"
                className="border bg-primary-foreground"
              />
              <ColorSwatch name="Secondary" className="bg-secondary" />
              <ColorSwatch
                name="Secondary Foreground"
                className="bg-secondary-foreground"
              />
              <ColorSwatch name="Muted" className="bg-muted" />
              <ColorSwatch
                name="Muted Foreground"
                className="bg-muted-foreground"
              />
              <ColorSwatch name="Accent" className="bg-accent" />
              <ColorSwatch
                name="Accent Foreground"
                className="bg-accent-foreground"
              />
              <ColorSwatch name="Destructive" className="bg-destructive" />
              <ColorSwatch
                name="Destructive Foreground"
                className="bg-destructive-foreground"
              />
              <ColorSwatch name="Border" className="bg-border" />
              <ColorSwatch name="Input" className="bg-input" />
              <ColorSwatch name="Ring" className="bg-ring" />
            </div>
          </section>

          <Separator />

          {/* Typography */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Typography</h2>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold">Heading 1</h1>
                <p className="text-sm text-muted-foreground">
                  text-4xl font-bold
                </p>
              </div>
              <div>
                <h2 className="text-3xl font-semibold">Heading 2</h2>
                <p className="text-sm text-muted-foreground">
                  text-3xl font-semibold
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Heading 3</h3>
                <p className="text-sm text-muted-foreground">
                  text-2xl font-semibold
                </p>
              </div>
              <div>
                <h4 className="text-xl font-semibold">Heading 4</h4>
                <p className="text-sm text-muted-foreground">
                  text-xl font-semibold
                </p>
              </div>
              <div>
                <p className="text-base">Regular paragraph text</p>
                <p className="text-sm text-muted-foreground">text-base</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Small muted text
                </p>
                <p className="text-sm text-muted-foreground">
                  text-sm text-muted-foreground
                </p>
              </div>
              <div>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                  Inline code
                </code>
              </div>
            </div>
          </section>

          <Separator />

          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Buttons</h2>
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">+</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled Outline
              </Button>
            </div>
          </section>

          <Separator />

          {/* Badges */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Badges</h2>
            <div className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </section>

          <Separator />

          {/* Form Elements */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Form Elements</h2>
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
                <CardDescription>
                  Various input types and states
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    type="password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="disabled">Disabled Input</Label>
                  <Input id="disabled" disabled placeholder="Disabled input" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="textarea">Textarea</Label>
                  <Textarea
                    id="textarea"
                    placeholder="Type your message here..."
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Select & Dropdown */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Select & Dropdown</h2>
            <div className="flex flex-wrap gap-4">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline">Open Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </section>

          <Separator />

          {/* Toggle & Switch */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Toggle & Switch</h2>
            <div className="flex flex-wrap items-center gap-4">
              <Toggle>Toggle</Toggle>
              <Toggle pressed>Pressed</Toggle>
              <Toggle disabled>Disabled</Toggle>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch id="airplane-mode" />
                <Label htmlFor="airplane-mode">Airplane Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="wifi" defaultChecked />
                <Label htmlFor="wifi">Wi-Fi</Label>
              </div>
            </div>
          </section>

          <Separator />

          {/* Checkbox & Radio */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Checkbox & Radio Group</h2>
            <div className="flex flex-wrap gap-8">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Accept terms</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="newsletter" defaultChecked />
                  <Label htmlFor="newsletter">Subscribe to newsletter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="disabled-check" disabled />
                  <Label htmlFor="disabled-check">Disabled</Label>
                </div>
              </div>
              <RadioGroup defaultValue="comfortable">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="r1" />
                  <Label htmlFor="r1">Default</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comfortable" id="r2" />
                  <Label htmlFor="r2">Comfortable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="r3" />
                  <Label htmlFor="r3">Compact</Label>
                </div>
              </RadioGroup>
            </div>
          </section>

          <Separator />

          {/* Slider & Progress */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Slider & Progress</h2>
            <div className="max-w-sm space-y-6">
              <Slider defaultValue={[50]} max={100} step={1} />
              <Slider defaultValue={[25, 75]} max={100} step={1} />
              <Progress value={60} />
              <Progress value={33} />
            </div>
          </section>

          <Separator />

          {/* Avatar */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Avatar</h2>
            <div className="flex flex-wrap gap-4">
              <Avatar>
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  AB
                </AvatarFallback>
              </Avatar>
            </div>
          </section>

          <Separator />

          {/* Cards */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Cards</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content with some text.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Card with Footer</CardTitle>
                  <CardDescription>Card with action buttons</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This card has a footer with actions.</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost">Cancel</Button>
                  <Button>Submit</Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Tabs */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tabs</h2>
            <Tabs defaultValue="account" className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                      Manage your account settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" defaultValue="John Doe" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue="@johndoe" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save changes</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                      Change your password here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="current">Current password</Label>
                      <Input id="current" type="password" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new">New password</Label>
                      <Input id="new" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save password</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                      Configure your preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="notifications" />
                      <Label htmlFor="notifications">
                        Enable notifications
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="marketing" />
                      <Label htmlFor="marketing">Marketing emails</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          <Separator />

          {/* Dialog */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Dialog</h2>
            <Dialog>
              <Button variant="outline">Open Dialog</Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </DialogContent>
            </Dialog>
          </section>

          <Separator />

          {/* Tooltip */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tooltip</h2>
            <div className="flex flex-wrap gap-4">
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to library</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="secondary">Another tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a helpful tooltip</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </section>

          <Separator />

          {/* Accordion */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Accordion</h2>
            <Accordion className="w-full max-w-md">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>
                  Yes. It comes with default styles that match the other
                  components.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is it animated?</AccordionTrigger>
                <AccordionContent>
                  Yes. Its animated by default, but you can disable it if you
                  prefer.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <Separator />

          {/* Breadcrumb */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Breadcrumb</h2>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </section>

          <Separator />

          {/* Table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Table</h2>
            <div className="rounded-md border">
              <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">INV001</TableCell>
                    <TableCell>
                      <Badge variant="outline">Pending</Badge>
                    </TableCell>
                    <TableCell>Credit Card</TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV002</TableCell>
                    <TableCell>
                      <Badge>Paid</Badge>
                    </TableCell>
                    <TableCell>PayPal</TableCell>
                    <TableCell className="text-right">$150.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV003</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Overdue</Badge>
                    </TableCell>
                    <TableCell>Bank Transfer</TableCell>
                    <TableCell className="text-right">$350.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          <Separator />

          {/* ScrollArea */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">ScrollArea</h2>
            <ScrollArea className="h-48 w-full max-w-md rounded-md border p-4">
              <div className="space-y-4">
                <h4 className="text-sm leading-none font-medium">Tags</h4>
                <div className="text-sm">
                  <p className="mb-4">
                    This is a scrollable area with custom styling.
                  </p>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                    >
                      <span>Item {i + 1}</span>
                      <Badge variant="outline">Tag</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </section>

          <Separator />

          {/* Skeleton */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Skeleton</h2>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Footer */}
          <footer className="py-8 text-center text-sm text-muted-foreground">
            <p>Design System Showcase</p>
            <p className="mt-1">Press D to toggle dark mode</p>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  )
}
