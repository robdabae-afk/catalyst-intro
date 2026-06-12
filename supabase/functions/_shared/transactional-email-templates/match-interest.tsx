/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  investorName?: string
  eventName?: string
  threadUrl?: string
}

const Email = ({
  investorName = 'An investor',
  eventName = 'the event',
  threadUrl = 'https://catalystintro.com/match/inbox',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{investorName} is interested in your startup</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You have a new match</Heading>
        <Text style={text}>
          <strong>{investorName}</strong> expressed interest in your startup at{' '}
          <strong>{eventName}</strong>. A private chat has been opened so you
          can connect.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={threadUrl} style={button}>
            Open Chat
          </Button>
        </Section>
        <Text style={muted}>
          Reply quickly while the event is live — momentum matters.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Catalyst Intro · Match
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) =>
    `${d?.investorName ?? 'An investor'} is interested in your startup`,
  displayName: 'Match — Investor Interest',
  previewData: {
    investorName: 'Jane Doe',
    eventName: 'Catalyst Demo Night',
    threadUrl: 'https://catalystintro.com/match/inbox',
  },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif',
  padding: '40px 0',
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
  backgroundColor: '#0a0a0a',
  borderRadius: '12px',
  color: '#ffffff',
}
const h1: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#ffffff',
  margin: '0 0 16px',
  fontFamily: 'Georgia, "Times New Roman", serif',
}
const text: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#e5e5e5',
  margin: '0 0 16px',
}
const muted: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#999999',
  margin: '0',
}
const button: React.CSSProperties = {
  backgroundColor: '#ffffff',
  color: '#000000',
  padding: '12px 28px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const hr: React.CSSProperties = {
  borderColor: '#262626',
  margin: '32px 0 16px',
}
const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#777777',
  margin: 0,
}
