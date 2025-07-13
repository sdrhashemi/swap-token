use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("2ojyPqK6ZJbYtFZn6WFWVAFMoDQ4GpiZe6svpe1EBfB9");

#[program]
pub mod fee_swap {
    use super::*;

    pub fn swap_with_fee(
        ctx: Context<SwapWithFee>,
        amount_in: u64,
    ) -> Result<()> {
        let fee = amount_in / 20;
        let amount_after_fee = amount_in - fee;

        msg!("Taking 5% fee: {} tokens", fee);

        //treasury
        token::transfer(
            ctx.accounts.transfer_to_treasury_ctx(),
            fee,
        )?;

        token::transfer(
            ctx.accounts.transfer_to_dex_ctx(),
            amount_after_fee,
        )?;

        msg!("Transferred {} to DEX vault", amount_after_fee);

        Ok(())
    }
}


#[derive(Accounts)]
pub struct SwapWithFee<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_source: Account<'info, TokenAccount>,

    #[account(mut)]
    pub fee_wallet: Account<'info, TokenAccount>,

    #[account(mut)]
    pub dex_input_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> SwapWithFee<'info> {
    fn transfer_to_treasury_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_source.to_account_info(),
                to: self.fee_wallet.to_account_info(),
                authority: self.user.to_account_info(),
            },
        )
    }

    fn transfer_to_dex_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_source.to_account_info(),
                to: self.dex_input_vault.to_account_info(),
                authority: self.user.to_account_info(),
            },
        )
    }
}
