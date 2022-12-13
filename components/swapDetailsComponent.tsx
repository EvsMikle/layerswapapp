import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react'
import { useSettingsState } from '../context/settings';
import LayerSwapApiClient, { SwapItem, SwapType } from '../lib/layerSwapApiClient';
import Image from 'next/image'
import toast from 'react-hot-toast';
import shortenAddress from './utils/ShortenAddress';
import CopyButton from './buttons/copyButton';
import { SwapDetailsComponentSceleton } from './Sceletons';
import StatusIcon from './StatusIcons';
import { GetExchangeFee } from '../lib/fees';
import { Exchange } from '../Models/Exchange';
import { CryptoNetwork } from '../Models/CryptoNetwork';

type Props = {
    id: string
}

const SwapDetails: FC<Props> = ({ id }) => {
    const { exchanges, networks, currencies, discovery: { resource_storage_url } } = useSettingsState()
    const [swap, setSwap] = useState<SwapItem>()
    const [loading, setLoading] = useState(false)
    const router = useRouter();

    let source: Exchange | CryptoNetwork
    let destination: Exchange | CryptoNetwork

    let source_display_name: string
    let destination_display_name: string

    let source_logo: string;
    let destination_logo: string;

    if (swap) {
        if (swap.source_exchange) {
            source = exchanges?.find(e => e?.internal_name?.toUpperCase() === swap?.source_exchange?.toUpperCase())
            source_display_name = source.display_name;
            source_logo = `${resource_storage_url}/layerswap/exchanges/${source?.internal_name?.toLocaleLowerCase()}.png`
        }
        else {
            source = networks?.find(e => e?.internal_name?.toUpperCase() === swap?.source_network?.toUpperCase())
            source_display_name = source.display_name;
            source_logo = `${resource_storage_url}/layerswap/networks/${source?.internal_name?.toLocaleLowerCase()}.png`
        }

        if (swap.destination_exchange) {
            destination = exchanges?.find(e => e?.internal_name?.toUpperCase() === swap?.destination_exchange?.toUpperCase())
            destination_display_name = destination.display_name;
            destination_logo = `${resource_storage_url}/layerswap/exchanges/${destination?.internal_name?.toLocaleLowerCase()}.png`
        }
        else {
            destination = networks?.find(e => e?.internal_name?.toUpperCase() === swap?.destination_network?.toUpperCase())
            destination_display_name = destination.display_name;
            destination_logo = `${resource_storage_url}/layerswap/networks/${destination?.internal_name?.toLocaleLowerCase()}.png`
        }
    }

    const exchange = (swap?.source_exchange ? source : destination) as Exchange
    const currency = exchange?.currencies?.find(c => c.network?.toUpperCase() === swap?.source_network?.toUpperCase())
    const currency_precision = currencies?.find(c => currency?.asset === c.asset)?.precision

    useEffect(() => {
        (async () => {
            if (!id)
                return
            setLoading(true)
            try {
                const layerswapApiClient = new LayerSwapApiClient(router)
                const swapResponse = await layerswapApiClient.GetSwapDetailsAsync(id)
                setSwap(swapResponse.data)
            }
            catch (e) {
                toast.error(e.message)
            }
            finally {
                setLoading(false)
            }
        })()
    }, [id, router.query])

    if (loading)
        return <SwapDetailsComponentSceleton />

    return (
        <>
            <div className="w-full grid grid-flow-row animate-fade-in">
                <div className="rounded-md w-full grid grid-flow-row">
                    <div className="items-center space-y-1.5 block text-base font-lighter leading-6 text-primary-text">
                        <div className="flex justify-between p items-baseline">
                            <span className="text-left">Id </span>
                            <span className="text-white">
                                <div className='inline-flex items-center'>
                                    <CopyButton toCopy={swap?.id} iconClassName="text-gray-500">
                                        {shortenAddress(swap?.id)}
                                    </CopyButton>
                                </div>
                            </span>
                        </div>
                        <hr className='horizontal-gradient' />
                        <div className="flex justify-between p items-baseline">
                            <span className="text-left">Status </span>
                            <span className="text-white">
                                {swap && <StatusIcon status={swap?.status} />}
                            </span>
                        </div>
                        <hr className='horizontal-gradient' />
                        <div className="flex justify-between items-baseline">
                            <span className="text-left">Date </span>
                            <span className='text-white font-normal'>{(new Date(swap?.created_date)).toLocaleString()}</span>
                        </div>
                        <hr className='horizontal-gradient' />
                        <div className="flex justify-between items-baseline">
                            <span className="text-left">From  </span>
                            {
                                source && <div className="flex items-center">
                                    <div className="flex-shrink-0 h-5 w-5 relative">
                                        {
                                            <Image
                                                src={source_logo}
                                                alt="Exchange Logo"
                                                height="60"
                                                width="60"
                                                layout="responsive"
                                                className="rounded-md object-contain"
                                            />
                                        }

                                    </div>
                                    <div className="mx-1 text-white">{source?.display_name}</div>
                                </div>
                            }
                        </div>
                        <hr className='horizontal-gradient' />
                        <div className="flex justify-between items-baseline">
                            <span className="text-left">To </span>
                            {
                                destination && <div className="flex items-center">
                                    <div className="flex-shrink-0 h-5 w-5 relative">
                                        {
                                            <Image
                                                src={destination_logo}
                                                alt="Exchange Logo"
                                                height="60"
                                                width="60"
                                                layout="responsive"
                                                className="rounded-md object-contain"
                                            />
                                        }
                                    </div>
                                    <div className="mx-1 text-white">{destination?.display_name}</div>
                                </div>
                            }
                        </div>
                        <hr className='horizontal-gradient' />
                        <div className="flex justify-between items-baseline">
                            <span className="text-left">Address </span>
                            <span className="text-white">
                                <div className='inline-flex items-center'>
                                    <CopyButton toCopy={swap?.destination_address} iconClassName="text-gray-500">
                                        {swap?.destination_address.slice(0, 8) + "..." + swap?.destination_address.slice(swap?.destination_address.length - 5, swap?.destination_address.length)}
                                    </CopyButton>
                                </div>
                            </span>
                        </div>
                        <hr className='horizontal-gradient' />
                        <div className="flex justify-between items-baseline">
                            <span className="text-left">Amount we received</span>
                            <span className='text-white font-normal flex'>
                                {swap?.input_transaction?.amount} {currency?.asset}
                            </span>
                        </div>
                        <hr className='horizontal-gradient' />
                        <div className="flex justify-between items-baseline">
                            <span className="text-left">Layerswap Fee </span>
                            <span className='text-white font-normal'>{parseFloat(swap?.fee?.toFixed(currency_precision))} {currency?.asset}</span>
                        </div>
                        <hr className='horizontal-gradient' />
                        {
                            swap?.status == 'completed' &&
                            <>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-left">Amount You Received</span>
                                    <span className='text-white font-normal flex'>
                                        {swap?.output_transaction?.amount} {currency?.asset}
                                    </span>
                                </div>
                                <hr className='horizontal-gradient' />
                            </>
                        }
                        
                    </div>
                </div>
            </div>
        </>
    )
}

export default SwapDetails;