import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders input with default props', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('renders input with different types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    let input = screen.getByPlaceholderText('Email')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    input = screen.getByPlaceholderText('Password')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    
    await user.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />)
    const input = screen.getByPlaceholderText('Custom')
    expect(input).toHaveClass('custom-input')
  })

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled" />)
    const input = screen.getByPlaceholderText('Disabled')
    expect(input).toBeDisabled()
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} placeholder="Ref test" />)
    expect(ref).toHaveBeenCalled()
  })

  it('handles value prop', () => {
    render(<Input value="Test value" readOnly />)
    const input = screen.getByDisplayValue('Test value')
    expect(input).toBeInTheDocument()
  })
}) 